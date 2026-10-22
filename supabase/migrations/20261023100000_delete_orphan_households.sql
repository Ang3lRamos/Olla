-- Al borrar un usuario, Supabase borra su membresía (cascade), pero el hogar quedaba huérfano:
-- con sus semanas, despensa y recetas, sin nadie que pueda verlos. Cuando sale el último
-- miembro, el hogar se borra y con él todo lo suyo (las tablas hijas tienen on delete cascade).

create function public.delete_household_without_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.household_members where household_id = old.household_id) then
    delete from public.households where id = old.household_id;
  end if;
  return null;
end;
$$;

create trigger delete_household_without_members
after delete on public.household_members
for each row execute function public.delete_household_without_members();

-- Limpia los hogares que ya quedaron huérfanos antes de este cambio.
delete from public.households h
where not exists (select 1 from public.household_members m where m.household_id = h.id);
