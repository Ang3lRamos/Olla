-- En el plan Gratis, una propuesta de menú del asistente por semana (de lunes a domingo, hora de
-- Colombia), para que se vea lo que hacen los planes pagos. Ajustar, revisar notas y pegar
-- recetas siguen siendo de Básico y Pro.

create table public.free_weekly_menus (
  household_id uuid not null references public.households (id) on delete cascade,
  week_start date not null,
  used_at timestamptz not null default now(),
  primary key (household_id, week_start)
);
alter table public.free_weekly_menus enable row level security;
revoke all on public.free_weekly_menus from anon, authenticated;

-- Lunes de la semana en curso, en Colombia.
create function public.ai_week_start()
returns date language sql stable as $$ select date_trunc('week', public.ai_today())::date $$;

-- Gasta el menú gratis de esta semana; false si el hogar tiene plan pago o ya lo usó.
create function public.consume_free_weekly_menu(target_household_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  inserted integer;
begin
  if not public.is_household_member(target_household_id) then
    raise exception 'No perteneces a este hogar';
  end if;
  if (select plan from public.effective_plan(target_household_id)) <> 'free' then
    return false;
  end if;
  insert into public.free_weekly_menus (household_id, week_start)
  values (target_household_id, public.ai_week_start())
  on conflict do nothing;
  get diagnostics inserted = row_count;
  return inserted = 1;
end;
$$;

-- Si la IA falla, el menú gratis no se pierde.
create function public.refund_free_weekly_menu(target_household_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  delete from public.free_weekly_menus
  where household_id = target_household_id
    and week_start = public.ai_week_start()
    and public.is_household_member(target_household_id);
$$;

drop function public.get_ai_quota(uuid);
create function public.get_ai_quota(target_household_id uuid)
returns table (
  plan text,
  daily_limit smallint,
  used smallint,
  expires_at timestamptz,
  trial_used boolean,
  free_menu_available boolean
)
language sql stable security definer set search_path = ''
as $$
  select p.plan, p.daily_limit, coalesce(u.requests, 0::smallint), p.expires_at, p.trial_used,
    p.plan = 'free' and not exists (
      select 1 from public.free_weekly_menus f
      where f.household_id = target_household_id and f.week_start = public.ai_week_start()
    )
  from public.effective_plan(target_household_id) p
  left join public.ai_usage u on u.household_id = target_household_id and u.used_on = public.ai_today()
  where public.is_household_member(target_household_id);
$$;

revoke execute on function public.ai_week_start() from public, anon;
revoke execute on function
  public.consume_free_weekly_menu(uuid),
  public.refund_free_weekly_menu(uuid),
  public.get_ai_quota(uuid)
from public, anon;
grant execute on function
  public.consume_free_weekly_menu(uuid),
  public.refund_free_weekly_menu(uuid),
  public.get_ai_quota(uuid)
to authenticated;
