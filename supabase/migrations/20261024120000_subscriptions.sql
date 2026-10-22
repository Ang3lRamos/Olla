-- Planes pagos con Wompi: Básico y Pro, por mes o por trimestre, con vencimiento.
-- Los precios viven aquí y no en el cliente: el monto de cada pago lo fija la base, así nadie
-- puede crear un pago de $1 por un plan de $19.900.

create table public.plan_prices (
  plan text not null check (plan in ('basic', 'pro')),
  period text not null check (period in ('month', 'quarter')),
  amount_in_cents bigint not null check (amount_in_cents > 0),
  days smallint not null check (days > 0),
  ai_daily_limit smallint not null check (ai_daily_limit between 1 and 500),
  primary key (plan, period)
);

insert into public.plan_prices (plan, period, amount_in_cents, days, ai_daily_limit) values
  ('basic', 'month', 990000, 30, 5),
  ('basic', 'quarter', 2490000, 90, 5),
  ('pro', 'month', 1990000, 30, 20),
  ('pro', 'quarter', 4990000, 90, 20);

alter table public.plan_prices enable row level security;
create policy "Todos ven los precios" on public.plan_prices for select to authenticated using (true);

-- El plan ahora puede vencer. expires_at nulo = no vence (asignado a mano, como la cuenta del
-- dueño). trial_used evita repetir la prueba gratis.
alter table public.household_entitlements drop constraint household_entitlements_plan_check;
alter table public.household_entitlements
  add constraint household_entitlements_plan_check check (plan in ('free', 'basic', 'pro')),
  add column expires_at timestamptz,
  add column trial_used boolean not null default false;

create table public.payments (
  reference text primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  plan text not null,
  period text not null,
  amount_in_cents bigint not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR')),
  wompi_transaction_id text unique,
  payment_method_type text,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (plan, period) references public.plan_prices (plan, period)
);
create index payments_household_id_idx on public.payments (household_id);

alter table public.payments enable row level security;
create policy "Miembros ven los pagos de su hogar" on public.payments
  for select to authenticated using (public.is_household_member(household_id));

-- Plan vigente: si ya venció, el hogar vuelve a "free" sin que nadie tenga que tocar la fila.
create function public.effective_plan(target_household_id uuid)
returns table (plan text, daily_limit smallint, expires_at timestamptz, trial_used boolean)
language sql stable security definer set search_path = ''
as $$
  select
    case when e.household_id is null or (e.expires_at is not null and e.expires_at <= now())
      then 'free' else e.plan end,
    case when e.household_id is null or (e.expires_at is not null and e.expires_at <= now())
      then 0::smallint else e.ai_daily_limit end,
    case when e.expires_at > now() then e.expires_at end,
    coalesce(e.trial_used, false)
  from (select 1) as one
  left join public.household_entitlements e on e.household_id = target_household_id;
$$;
revoke execute on function public.effective_plan from public, anon, authenticated;

drop function public.get_ai_quota(uuid);
create function public.get_ai_quota(target_household_id uuid)
returns table (plan text, daily_limit smallint, used smallint, expires_at timestamptz, trial_used boolean)
language sql stable security definer set search_path = ''
as $$
  select p.plan, p.daily_limit, coalesce(u.requests, 0::smallint), p.expires_at, p.trial_used
  from public.effective_plan(target_household_id) p
  left join public.ai_usage u on u.household_id = target_household_id and u.used_on = public.ai_today()
  where public.is_household_member(target_household_id);
$$;

create or replace function public.consume_ai_request(target_household_id uuid)
returns table (allowed boolean, plan text, daily_limit smallint, used smallint)
language plpgsql security definer set search_path = ''
as $$
declare
  household_plan text;
  household_limit smallint;
  new_count smallint;
begin
  if not public.is_household_member(target_household_id) then
    raise exception 'No perteneces a este hogar';
  end if;

  select p.plan, p.daily_limit into household_plan, household_limit
  from public.effective_plan(target_household_id) p;

  if household_plan = 'free' or household_limit = 0 then
    return query select false, household_plan, household_limit, 0::smallint;
    return;
  end if;

  -- Con límite nulo se cuenta el uso (para estadísticas) pero nunca se bloquea.
  insert into public.ai_usage as usage (household_id, used_on, requests)
  values (target_household_id, public.ai_today(), 1)
  on conflict (household_id, used_on) do update set requests = usage.requests + 1
  where household_limit is null or usage.requests < household_limit
  returning usage.requests into new_count;

  if new_count is null then
    return query select false, household_plan, household_limit, household_limit;
  else
    return query select true, household_plan, household_limit, new_count;
  end if;
end;
$$;

-- Crea el pago pendiente con el monto de la tabla de precios; Olla manda la persona a Wompi
-- con esta referencia.
create function public.create_payment(target_household_id uuid, target_plan text, target_period text)
returns table (reference text, amount_in_cents bigint)
language plpgsql security definer set search_path = ''
as $$
declare
  price public.plan_prices;
  new_reference text := 'olla-' || replace(gen_random_uuid()::text, '-', '');
begin
  if not public.is_household_member(target_household_id) then
    raise exception 'No perteneces a este hogar';
  end if;
  select * into price from public.plan_prices where plan = target_plan and period = target_period;
  if not found then
    raise exception 'Plan no válido';
  end if;
  insert into public.payments (reference, household_id, plan, period, amount_in_cents)
  values (new_reference, target_household_id, target_plan, target_period, price.amount_in_cents);
  return query select new_reference, price.amount_in_cents;
end;
$$;

-- Registra lo que dijo Wompi y, si quedó aprobado por el monto correcto, activa o extiende el
-- plan. Es idempotente: el aviso de Wompi y la vuelta del usuario pueden llegar los dos.
-- Solo la ejecuta el servidor (service_role), nunca un usuario.
create function public.apply_payment(
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

  if payment.applied_at is null and transaction_status = 'APPROVED'
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

-- Siete días de Pro gratis, una sola vez por hogar y sin pedir tarjeta.
create function public.start_trial(target_household_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  current_plan record;
begin
  if not public.is_household_member(target_household_id) then
    raise exception 'No perteneces a este hogar';
  end if;
  select * into current_plan from public.effective_plan(target_household_id);
  if current_plan.trial_used or current_plan.plan <> 'free' then
    return false;
  end if;
  insert into public.household_entitlements (household_id, plan, ai_daily_limit, expires_at, trial_used, updated_at)
  values (target_household_id, 'pro', 20, now() + interval '7 days', true, now())
  on conflict (household_id) do update
    set plan = 'pro', ai_daily_limit = 20, expires_at = now() + interval '7 days',
        trial_used = true, updated_at = now();
  return true;
end;
$$;

revoke execute on function public.get_ai_quota, public.create_payment, public.start_trial from public, anon;
grant execute on function public.get_ai_quota, public.create_payment, public.start_trial to authenticated;
revoke execute on function public.apply_payment from public, anon, authenticated;
grant execute on function public.apply_payment to service_role;
