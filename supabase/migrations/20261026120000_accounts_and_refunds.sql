-- Cuentas que se borran y reembolsos.
--
-- Los pagos se conservan al borrar un hogar (la ley contable obliga a guardarlos): pierden el
-- vínculo con el hogar, no el registro. Un reembolso se pide (refund_requested_at) y lo marca
-- hecho el admin después de devolver el dinero en Wompi (refunded_at).
alter table public.payments
  alter column household_id drop not null,
  drop constraint payments_household_id_fkey,
  add constraint payments_household_id_fkey
    foreign key (household_id) references public.households (id) on delete set null,
  add column refund_requested_at timestamptz,
  add column refunded_at timestamptz;

create or replace function public.apply_payment(
  target_reference text,
  transaction_id text,
  transaction_status text,
  paid_amount_in_cents bigint,
  paid_currency text,
  method_type text
)
returns table (status text, plan text, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
-- Las columnas de salida se llaman como las de las tablas; en las consultas mandan las columnas.
#variable_conflict use_column
declare
  payment public.payments;
  price public.plan_prices;
  current_entitlement public.household_entitlements;
  starts_at timestamptz;
begin
  select * into payment from public.payments where reference = target_reference for update;
  if not found then
    raise exception 'Pago desconocido: %', target_reference;
  end if;

  if payment.applied_at is null then
    update public.payments
    set status = transaction_status, wompi_transaction_id = transaction_id,
        payment_method_type = method_type, updated_at = now()
    where reference = target_reference;
  end if;

  -- Si el hogar se borró mientras el pago estaba pendiente, se registra el estado pero no hay
  -- plan que activar.
  if payment.applied_at is null and transaction_status = 'APPROVED' and payment.household_id is not null
     and paid_amount_in_cents = payment.amount_in_cents and paid_currency = 'COP' then
    select * into price from public.plan_prices where plan = payment.plan and period = payment.period;
    select * into current_entitlement from public.household_entitlements
    where household_id = payment.household_id for update;

    -- Mismo plan aún vigente: se suma al final. Otro plan o vencido: empieza hoy.
    starts_at := case
      when current_entitlement.plan = payment.plan and current_entitlement.expires_at > now()
        then current_entitlement.expires_at
      else now()
    end;

    insert into public.household_entitlements (household_id, plan, ai_daily_limit, expires_at, updated_at)
    values (payment.household_id, payment.plan, price.ai_daily_limit, starts_at + make_interval(days => price.days), now())
    on conflict (household_id) do update
      set plan = excluded.plan, ai_daily_limit = excluded.ai_daily_limit,
          expires_at = excluded.expires_at, updated_at = now()
      -- Un plan asignado a mano sin vencimiento (p. ej. ilimitado) no se pisa con uno pago.
      where public.household_entitlements.expires_at is not null
         or public.household_entitlements.plan = 'free';

    update public.payments set applied_at = now() where reference = target_reference;
  end if;

  return query
    select p.status, e.plan, e.expires_at
    from public.payments p
    left join public.household_entitlements e on e.household_id = p.household_id
    where p.reference = target_reference;
end;
$$;

-- Defensa extra sobre la RLS: los permisos por defecto de Supabase incluyen TRUNCATE, que la RLS
-- no filtra. Nadie entra sin sesión a las tablas, y con sesión no hay TRUNCATE ni TRIGGER.
revoke all on all tables in schema public from anon;
revoke truncate, trigger, references on all tables in schema public from authenticated;
revoke execute on function public.delete_household_without_members from public, anon, authenticated;
