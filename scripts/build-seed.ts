/**
 * Genera supabase/seed.sql a partir de src/seed. Es idempotente: se puede aplicar varias
 * veces y actualiza el catálogo global sin tocar los datos de los hogares.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SEED_INGREDIENTS, SEED_RECIPES } from "../src/seed";

const OUTPUT = fileURLToPath(new URL("../supabase/seed.sql", import.meta.url));

const text = (value: string | null | undefined) =>
  value === null || value === undefined ? "null" : `'${value.replaceAll("'", "''")}'`;
const textArray = (values: string[]) => `array[${values.map(text).join(", ")}]::text[]`;
const rows = (values: string[][]) => values.map((row) => `  (${row.join(", ")})`).join(",\n");

const ingredients = Object.values(SEED_INGREDIENTS);

const ingredientsSql = `insert into public.ingredients (household_id, name, category, base_unit, grams_per_unit) values
${rows(
  ingredients.map((ingredient) => [
    "null",
    text(ingredient.name),
    text(ingredient.category),
    text(ingredient.baseUnit),
    ingredient.gramsPerUnit === null ? "null" : String(ingredient.gramsPerUnit),
  ]),
)}
on conflict (household_id, name) do update set
  category = excluded.category, base_unit = excluded.base_unit, grams_per_unit = excluded.grams_per_unit;`;

const pricesSql = `insert into public.ingredient_prices (household_id, ingredient_id, price_cop, per_amount, per_unit)
select null, i.id, v.price_cop, v.per_amount, v.per_unit
from (values
${rows(
  ingredients.map((ingredient) => [
    text(ingredient.name),
    String(ingredient.price.cop),
    `${ingredient.price.per.amount}::numeric`,
    text(ingredient.price.per.unit),
  ]),
)}
) as v (name, price_cop, per_amount, per_unit)
join public.ingredients i on i.household_id is null and i.name = v.name
on conflict (household_id, ingredient_id) do update set
  price_cop = excluded.price_cop, per_amount = excluded.per_amount, per_unit = excluded.per_unit, updated_at = now();`;

const recipesSql = `insert into public.recipes (household_id, name, category, base_servings, prep_minutes, steps) values
${rows(
  SEED_RECIPES.map((recipe) => [
    "null",
    text(recipe.name),
    text(recipe.category),
    String(recipe.baseServings),
    String(recipe.prepMinutes),
    textArray(recipe.steps),
  ]),
)}
on conflict (household_id, name) do update set
  category = excluded.category, base_servings = excluded.base_servings,
  prep_minutes = excluded.prep_minutes, steps = excluded.steps;`;

const recipeIngredientsSql = `delete from public.recipe_ingredients
where recipe_id in (select id from public.recipes where household_id is null);

insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position)
select r.id, i.id, v.quantity, v.unit, v.note, v.position
from (values
${rows(
  SEED_RECIPES.flatMap((recipe) =>
    recipe.ingredients.map((entry, position) => [
      text(recipe.name),
      text(SEED_INGREDIENTS[entry.key].name),
      `${entry.amount}::numeric`,
      text(entry.unit),
      `${text(entry.note)}::text`,
      `${position}::smallint`,
    ]),
  ),
)}
) as v (recipe_name, ingredient_name, quantity, unit, note, position)
join public.recipes r on r.household_id is null and r.name = v.recipe_name
join public.ingredients i on i.household_id is null and i.name = v.ingredient_name;`;

const sql = `-- Generado por scripts/build-seed.ts (npm run db:seed-sql). No editar a mano.
-- Catálogo global: ${ingredients.length} ingredientes con precios de referencia y ${SEED_RECIPES.length} recetas.

begin;

${ingredientsSql}

${pricesSql}

${recipesSql}

${recipeIngredientsSql}

commit;
`;

writeFileSync(OUTPUT, sql);
console.log(`seed.sql: ${ingredients.length} ingredientes, ${SEED_RECIPES.length} recetas`);
