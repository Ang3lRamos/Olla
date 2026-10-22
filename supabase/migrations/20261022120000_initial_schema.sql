-- Esquema inicial de Olla. El hogar es el tenant: todo lo editable pertenece a un hogar.
-- Recetas, ingredientes y precios con household_id nulo son el catálogo global de referencia.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  default_people smallint not null default 4 check (default_people between 1 and 20),
  weekly_budget_cop integer check (weekly_budget_cop >= 0),
  -- { "exclude": string[] }: lo que el hogar no quiere en el menú; lo usa el asistente.
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_id_idx on public.household_members (user_id);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  category text not null check (category in (
    'vegetables', 'fruits', 'proteins', 'dairy', 'grains',
    'bakery', 'pantry', 'spices', 'beverages', 'cleaning'
  )),
  base_unit text not null check (base_unit in ('g', 'ml', 'unit')),
  grams_per_unit numeric check (grams_per_unit > 0),
  unique nulls not distinct (household_id, name)
);

create table public.ingredient_prices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  price_cop integer not null check (price_cop >= 0),
  per_amount numeric not null check (per_amount > 0),
  per_unit text not null check (per_unit in ('g', 'kg', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'unit')),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (household_id, ingredient_id)
);
create index ingredient_prices_ingredient_id_idx on public.ingredient_prices (ingredient_id);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (category in ('breakfast', 'soup', 'main', 'light', 'side')),
  base_servings smallint not null check (base_servings between 1 and 50),
  prep_minutes smallint check (prep_minutes > 0),
  steps text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique nulls not distinct (household_id, name)
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit text not null check (unit in ('g', 'kg', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'unit')),
  note text check (char_length(note) <= 120),
  position smallint not null default 0
);
create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_ingredient_id_idx on public.recipe_ingredients (ingredient_id);

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  quantity numeric not null check (quantity >= 0),
  unit text not null check (unit in ('g', 'kg', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'unit')),
  updated_at timestamptz not null default now(),
  unique (household_id, ingredient_id)
);

create table public.week_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  people smallint not null check (people between 1 and 20),
  created_at timestamptz not null default now(),
  unique (household_id, week_start)
);

create table public.meal_slots (
  id uuid primary key default gen_random_uuid(),
  week_plan_id uuid not null references public.week_plans (id) on delete cascade,
  day smallint not null check (day between 0 and 6),
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner')),
  recipe_id uuid not null references public.recipes (id) on delete restrict,
  people_override smallint check (people_override between 1 and 20),
  unique (week_plan_id, day, meal)
);
create index meal_slots_recipe_id_idx on public.meal_slots (recipe_id);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  week_plan_id uuid not null references public.week_plans (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  quantity numeric not null check (quantity >= 0),
  unit text not null check (unit in ('g', 'ml', 'unit')),
  checked boolean not null default false,
  unique (week_plan_id, ingredient_id, unit)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  date date not null,
  meal text check (meal in ('breakfast', 'lunch', 'dinner')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index notes_household_date_idx on public.notes (household_id, date);

-- Autorización ---------------------------------------------------------------

create function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members
    where household_id = target_household_id and user_id = (select auth.uid())
  );
$$;

create function public.can_access_week_plan(target_week_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.week_plans
    where id = target_week_plan_id and public.is_household_member(household_id)
  );
$$;

-- Crear el hogar y su primer miembro debe ser atómico: antes de existir la membresía,
-- la RLS no dejaría al usuario insertar en households.
create function public.create_household(household_name text, people smallint, budget_cop integer, household_preferences jsonb)
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

revoke execute on function public.create_household from public, anon;
grant execute on function public.create_household to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.ingredients enable row level security;
alter table public.ingredient_prices enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.pantry_items enable row level security;
alter table public.week_plans enable row level security;
alter table public.meal_slots enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.notes enable row level security;

create policy "Miembros leen su hogar" on public.households
  for select to authenticated using (public.is_household_member(id));
create policy "Miembros editan su hogar" on public.households
  for update to authenticated using (public.is_household_member(id)) with check (public.is_household_member(id));

create policy "Miembros ven las membresías de su hogar" on public.household_members
  for select to authenticated using (user_id = (select auth.uid()) or public.is_household_member(household_id));

-- Catálogo: lo global es de solo lectura; lo propio del hogar se puede editar.
create policy "Leer ingredientes globales y del hogar" on public.ingredients
  for select to authenticated using (household_id is null or public.is_household_member(household_id));
create policy "Gestionar ingredientes del hogar" on public.ingredients
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "Leer precios globales y del hogar" on public.ingredient_prices
  for select to authenticated using (household_id is null or public.is_household_member(household_id));
create policy "Gestionar precios del hogar" on public.ingredient_prices
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "Leer recetas globales y del hogar" on public.recipes
  for select to authenticated using (household_id is null or public.is_household_member(household_id));
create policy "Gestionar recetas del hogar" on public.recipes
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "Leer ingredientes de recetas visibles" on public.recipe_ingredients
  for select to authenticated using (
    exists (select 1 from public.recipes r where r.id = recipe_id
      and (r.household_id is null or public.is_household_member(r.household_id)))
  );
create policy "Gestionar ingredientes de recetas del hogar" on public.recipe_ingredients
  for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_household_member(r.household_id)))
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_household_member(r.household_id)));

create policy "Gestionar despensa del hogar" on public.pantry_items
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "Gestionar semanas del hogar" on public.week_plans
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "Gestionar comidas de semanas del hogar" on public.meal_slots
  for all to authenticated using (public.can_access_week_plan(week_plan_id)) with check (public.can_access_week_plan(week_plan_id));

create policy "Gestionar mercado de semanas del hogar" on public.shopping_list_items
  for all to authenticated using (public.can_access_week_plan(week_plan_id)) with check (public.can_access_week_plan(week_plan_id));

create policy "Gestionar notas del hogar" on public.notes
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
