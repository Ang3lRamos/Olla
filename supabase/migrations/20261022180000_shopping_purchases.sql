-- La lista de mercado se calcula siempre desde el menú; aquí solo se guarda lo que ya se compró
-- (y cuánto), para poder avisar si el menú cambió después de comprar. La tabla anterior guardaba
-- una copia de la lista que se desactualizaba; nunca se usó, así que se reemplaza.
drop table public.shopping_list_items;

create table public.shopping_purchases (
  week_plan_id uuid not null references public.week_plans (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  unit text not null check (unit in ('g', 'ml', 'unit')),
  quantity numeric not null check (quantity > 0),
  purchased_at timestamptz not null default now(),
  primary key (week_plan_id, ingredient_id, unit)
);

-- Lo que no sale de las recetas: aseo, mecato, lo que se acabó en la casa.
create table public.shopping_extras (
  id uuid primary key default gen_random_uuid(),
  week_plan_id uuid not null references public.week_plans (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  category text not null check (category in (
    'vegetables', 'fruits', 'proteins', 'dairy', 'grains',
    'bakery', 'pantry', 'spices', 'beverages', 'cleaning'
  )),
  checked boolean not null default false,
  created_at timestamptz not null default now()
);
create index shopping_extras_week_plan_id_idx on public.shopping_extras (week_plan_id);

alter table public.shopping_purchases enable row level security;
alter table public.shopping_extras enable row level security;

create policy "Gestionar compras de semanas del hogar" on public.shopping_purchases
  for all to authenticated using (public.can_access_week_plan(week_plan_id)) with check (public.can_access_week_plan(week_plan_id));

create policy "Gestionar extras de semanas del hogar" on public.shopping_extras
  for all to authenticated using (public.can_access_week_plan(week_plan_id)) with check (public.can_access_week_plan(week_plan_id));
