-- Permite consultas sin límite (ai_daily_limit nulo) para cuentas puntuales, p. ej. la del dueño.
-- Sin fila sigue siendo "free" con 0; un 0 explícito también deja el asistente apagado.

alter table public.household_entitlements drop constraint household_entitlements_ai_daily_limit_check;
alter table public.household_entitlements alter column ai_daily_limit drop not null;
alter table public.household_entitlements
  add constraint household_entitlements_ai_daily_limit_check
  check (ai_daily_limit is null or ai_daily_limit between 0 and 500);
comment on column public.household_entitlements.ai_daily_limit is 'Consultas al asistente por día; null = sin límite.';

create or replace function public.get_ai_quota(target_household_id uuid)
returns table (plan text, daily_limit smallint, used smallint)
language sql stable security definer set search_path = ''
as $$
  select
    coalesce(e.plan, 'free'),
    case when e.household_id is null then 0::smallint else e.ai_daily_limit end,
    coalesce(u.requests, 0::smallint)
  from (select 1) as one
  left join public.household_entitlements e on e.household_id = target_household_id
  left join public.ai_usage u on u.household_id = target_household_id and u.used_on = public.ai_today()
  where public.is_household_member(target_household_id);
$$;

create or replace function public.consume_ai_request(target_household_id uuid)
returns table (allowed boolean, plan text, daily_limit smallint, used smallint)
language plpgsql security definer set search_path = ''
as $$
declare
  household_plan text := 'free';
  household_limit smallint := 0;
  new_count smallint;
begin
  if not public.is_household_member(target_household_id) then
    raise exception 'No perteneces a este hogar';
  end if;

  select e.plan, e.ai_daily_limit into household_plan, household_limit
  from public.household_entitlements e where e.household_id = target_household_id;
  if not found then
    household_plan := 'free';
    household_limit := 0;
  end if;

  if household_plan <> 'pro' or household_limit = 0 then
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
