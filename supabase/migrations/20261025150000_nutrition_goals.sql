-- Metas nutricionales de cada persona (no del hogar): las pone ella y Olla solo compara.
-- Una fila por persona y nutriente; sin filas, no hay metas.
create table public.nutrition_goals (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  nutrient text not null check (nutrient in ('kcal', 'protein', 'carbs', 'sugar', 'fat', 'fiber')),
  target numeric not null check (target > 0 and target <= 20000),
  direction text not null check (direction in ('min', 'max')),
  updated_at timestamptz not null default now(),
  primary key (user_id, nutrient)
);

alter table public.nutrition_goals enable row level security;
create policy "Cada quien maneja sus metas" on public.nutrition_goals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
