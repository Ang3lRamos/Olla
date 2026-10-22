-- Guarda una receta del hogar y sus ingredientes en una sola transacción.
-- Corre con los permisos del usuario (security invoker): la RLS decide si puede escribir.
-- `ingredients` es un arreglo JSON de { ingredient_id, quantity, unit, note }.
create function public.save_household_recipe(
  target_recipe_id uuid,
  target_household_id uuid,
  recipe_name text,
  recipe_category text,
  servings smallint,
  minutes smallint,
  recipe_steps text[],
  ingredients jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if jsonb_array_length(ingredients) = 0 then
    raise exception 'La receta necesita al menos un ingrediente';
  end if;

  if target_recipe_id is null then
    insert into public.recipes (household_id, name, category, base_servings, prep_minutes, steps)
    values (target_household_id, recipe_name, recipe_category, servings, minutes, recipe_steps)
    returning id into saved_id;
  else
    update public.recipes
    set name = recipe_name, category = recipe_category, base_servings = servings,
        prep_minutes = minutes, steps = recipe_steps
    where id = target_recipe_id and household_id = target_household_id
    returning id into saved_id;

    if saved_id is null then
      raise exception 'Receta no encontrada en este hogar';
    end if;
    delete from public.recipe_ingredients where recipe_id = saved_id;
  end if;

  insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position)
  select saved_id, item.ingredient_id, item.quantity, item.unit, nullif(item.note, ''), (item.position - 1)::smallint
  from rows from (
    jsonb_to_recordset(ingredients) as (ingredient_id uuid, quantity numeric, unit text, note text)
  ) with ordinality as item (ingredient_id, quantity, unit, note, position);

  return saved_id;
end;
$$;

revoke execute on function public.save_household_recipe from public, anon;
grant execute on function public.save_household_recipe to authenticated;
