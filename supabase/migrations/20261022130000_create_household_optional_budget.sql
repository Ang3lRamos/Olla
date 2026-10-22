-- El presupuesto semanal es opcional: con un valor por defecto, el cliente puede omitirlo.
create or replace function public.create_household(
  household_name text,
  people smallint,
  budget_cop integer default null,
  household_preferences jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Se requiere una sesión para crear un hogar';
  end if;

  insert into public.households (name, default_people, weekly_budget_cop, preferences)
  values (household_name, people, budget_cop, coalesce(household_preferences, '{}'::jsonb))
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, (select auth.uid()), 'owner');

  return new_household_id;
end;
$$;
