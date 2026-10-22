-- Lo que el hogar compra de verdad: el precio propio describe una presentación (paquete de
-- 450 g con 18 tajadas, bloque de 500 g, cubeta de 30 huevos). Los de referencia no la tienen.
alter table public.ingredient_prices
  add column package_label text check (char_length(package_label) between 1 and 30),
  add column pieces integer check (pieces between 1 and 1000),
  add column piece_label text check (char_length(piece_label) between 1 and 20),
  add constraint ingredient_prices_pieces_with_label check ((pieces is null) = (piece_label is null));

-- "Ya la cocinamos": la comida descuenta sus ingredientes de la despensa. Se guarda lo que de
-- verdad se descontó para poder deshacerlo exacto.
alter table public.meal_slots
  add column cooked_at timestamptz,
  add column cooked_deductions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(cooked_deductions) = 'array');
