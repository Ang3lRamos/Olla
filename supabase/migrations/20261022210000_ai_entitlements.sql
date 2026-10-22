-- Plan del hogar y uso diario del asistente de IA.
-- El plan vive aparte de households porque los miembros pueden editar su hogar: si estuviera
-- allí, cualquiera podría ponerse "pro". Esta tabla solo se escribe con permisos de servidor
-- (hoy un script; mañana el webhook de pagos). Sin fila, el hogar es "free".

create table public.household_entitlements (
  household_id uuid primary key references public.households (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  ai_daily_limit smallint not null default 0 check (ai_daily_limit between 0 and 500),
  updated_at timestamptz not null default now()
);

create table public.ai_usage (
  household_id uuid not null references public.households (id) on delete cascade,
  used_on date not null,
  requests smallint not null default 0 check (requests >= 0),
  primary key (household_id, used_on)
);

alter table public.household_entitlements enable row level security;
alter table public.ai_usage enable row level security;

-- Solo lectura para los miembros; nadie escribe directamente desde el cliente.
create policy "Miembros ven el plan de su hogar" on public.household_entitlements
  for select to authenticated using (public.is_household_member(household_id));
create policy "Miembros ven el uso de su hogar" on public.ai_usage
  for select to authenticated using (public.is_household_member(household_id));

-- El día se cuenta en hora de Colombia, no en UTC.
create function public.ai_today() returns date
language sql stable set search_path = ''
as $$ select (now() at time zone 'America/Bogota')::date $$;

create function public.get_ai_quota(target_household_id uuid)
returns table (plan text, daily_limit smallint, used smallint)
language sql stable security definer set search_path = ''
as $$
  select
    coalesce(e.plan, 'free'),
    coalesce(e.ai_daily_limit, 0::smallint),
    coalesce(u.requests, 0::smallint)
  from (select 1) as one
  left join public.household_entitlements e on e.household_id = target_household_id
  left join public.ai_usage u on u.household_id = target_household_id and u.used_on = public.ai_today()
  where public.is_household_member(target_household_id);
$$;

-- Descuenta una consulta si el plan la permite y queda cupo; todo en una sola operación para
-- que dos pestañas a la vez no puedan pasarse del tope.
create function public.consume_ai_request(target_household_id uuid)
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

  select coalesce(e.plan, 'free'), coalesce(e.ai_daily_limit, 0::smallint)
  into household_plan, household_limit
  from (select 1) as one
  left join public.household_entitlements e on e.household_id = target_household_id;

  if household_plan <> 'pro' or household_limit = 0 then
    return query select false, household_plan, household_limit, 0::smallint;
    return;
  end if;

  insert into public.ai_usage as usage (household_id, used_on, requests)
  values (target_household_id, public.ai_today(), 1)
  on conflict (household_id, used_on) do update set requests = usage.requests + 1
  where usage.requests < household_limit
  returning usage.requests into new_count;

  if new_count is null then
    return query select false, household_plan, household_limit, household_limit;
  else
    return query select true, household_plan, household_limit, new_count;
  end if;
end;
$$;

-- Devuelve la consulta si la IA falló: un proveedor caído no debe gastar el cupo del hogar.
create function public.refund_ai_request(target_household_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.ai_usage set requests = greatest(requests - 1, 0)
  where household_id = target_household_id and used_on = public.ai_today()
    and public.is_household_member(target_household_id);
$$;

revoke execute on function public.get_ai_quota, public.consume_ai_request, public.refund_ai_request from public, anon;
grant execute on function public.get_ai_quota, public.consume_ai_request, public.refund_ai_request to authenticated;
