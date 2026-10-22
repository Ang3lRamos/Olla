import type { PGlite, Transaction } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestDatabase, createUser, SEED_SQL } from "./test-database";

const ANA = "00000000-0000-0000-0000-00000000000a";
const BETO = "00000000-0000-0000-0000-00000000000b";

let db: PGlite;
let anaHousehold: string;

const count = async (tx: PGlite | Transaction, sql: string, params: unknown[] = []) =>
  Number((await tx.query<{ n: number }>(`select count(*)::int as n from (${sql}) t`, params)).rows[0]!.n);

const createHousehold = (tx: Transaction, name: string) =>
  tx
    .query<{ id: string }>("select public.create_household($1, 4::smallint, 200000, '{}'::jsonb) as id", [
      name,
    ])
    .then((result) => result.rows[0]!.id);

beforeAll(async () => {
  db = await createTestDatabase();
  await db.exec(SEED_SQL);
  await createUser(db, ANA);
  await createUser(db, BETO);
  anaHousehold = await asUser(db, ANA, (tx) => createHousehold(tx, "Casa de Ana"));
  await asUser(db, BETO, (tx) => createHousehold(tx, "Casa de Beto"));
});

describe("semilla", () => {
  it("carga el catálogo global completo", async () => {
    expect(await count(db, "select 1 from public.recipes where household_id is null")).toBe(30);
    expect(await count(db, "select 1 from public.ingredients where household_id is null")).toBe(51);
    expect(await count(db, "select 1 from public.ingredient_prices where household_id is null")).toBe(51);
  });

  it("es idempotente", async () => {
    const before = await count(db, "select 1 from public.recipe_ingredients");
    await db.exec(SEED_SQL);
    expect(await count(db, "select 1 from public.recipes where household_id is null")).toBe(30);
    expect(await count(db, "select 1 from public.recipe_ingredients")).toBe(before);
  });
});

describe("hogares", () => {
  it("cada usuario ve solo su hogar", async () => {
    const names = await asUser(db, ANA, (tx) =>
      tx.query<{ name: string }>("select name from public.households"),
    );
    expect(names.rows.map((row) => row.name)).toEqual(["Casa de Ana"]);
  });

  it("no se puede crear un hogar sin sesión", async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.exec("set local role authenticated");
        await createHousehold(tx, "Fantasma");
      }),
    ).rejects.toThrow("Se requiere una sesión");
  });

  it("nadie edita el hogar de otro", async () => {
    await asUser(db, BETO, (tx) =>
      tx.query("update public.households set name = 'Hackeado' where id = $1", [anaHousehold]),
    );
    const name = await db.query<{ name: string }>("select name from public.households where id = $1", [
      anaHousehold,
    ]);
    expect(name.rows[0]!.name).toBe("Casa de Ana");
  });
});

describe("catálogo", () => {
  it("las recetas globales son visibles pero de solo lectura", async () => {
    await asUser(db, ANA, async (tx) => {
      expect(await count(tx, "select 1 from public.recipes")).toBe(30);
      await tx.query("update public.recipes set name = 'Cambiada' where household_id is null");
      await tx.query("delete from public.recipe_ingredients");
    });
    expect(await count(db, "select 1 from public.recipes where name = 'Cambiada'")).toBe(0);
    expect(await count(db, "select 1 from public.recipe_ingredients")).toBeGreaterThan(0);
  });

  it("las recetas propias solo las ve su hogar", async () => {
    await asUser(db, ANA, (tx) =>
      tx.query(
        "insert into public.recipes (household_id, name, category, base_servings) values ($1, 'Arepa de la abuela', 'breakfast', 4)",
        [anaHousehold],
      ),
    );
    expect(
      await asUser(db, BETO, (tx) =>
        count(tx, "select 1 from public.recipes where name = 'Arepa de la abuela'"),
      ),
    ).toBe(0);
    expect(
      await asUser(db, ANA, (tx) =>
        count(tx, "select 1 from public.recipes where name = 'Arepa de la abuela'"),
      ),
    ).toBe(1);
  });
});

describe("datos del hogar", () => {
  it("rechaza escribir en la despensa de otro hogar", async () => {
    await expect(
      asUser(db, BETO, (tx) =>
        tx.query(
          `insert into public.pantry_items (household_id, ingredient_id, quantity, unit)
           select $1, id, 1, 'kg' from public.ingredients where name = 'Arroz'`,
          [anaHousehold],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("las comidas de la semana heredan el acceso de su plan", async () => {
    const planId = await asUser(db, ANA, async (tx) => {
      const plan = await tx.query<{ id: string }>(
        "insert into public.week_plans (household_id, week_start, people) values ($1, '2026-10-19', 4) returning id",
        [anaHousehold],
      );
      const id = plan.rows[0]!.id;
      await tx.query(
        `insert into public.meal_slots (week_plan_id, day, meal, recipe_id)
         select $1, 0, 'lunch', id from public.recipes where name = 'Ajiaco'`,
        [id],
      );
      return id;
    });
    expect(await asUser(db, ANA, (tx) => count(tx, "select 1 from public.meal_slots"))).toBe(1);
    expect(await asUser(db, BETO, (tx) => count(tx, "select 1 from public.meal_slots"))).toBe(0);
    await expect(
      asUser(db, BETO, (tx) =>
        tx.query(
          `insert into public.meal_slots (week_plan_id, day, meal, recipe_id)
           select $1, 1, 'lunch', id from public.recipes where name = 'Ajiaco'`,
          [planId],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("la semana debe empezar en lunes", async () => {
    await expect(
      asUser(db, ANA, (tx) =>
        tx.query(
          "insert into public.week_plans (household_id, week_start, people) values ($1, '2026-10-21', 4)",
          [anaHousehold],
        ),
      ),
    ).rejects.toThrow(/week_plans_week_start_check/);
  });
});

describe("save_household_recipe", () => {
  const save = (tx: Transaction, recipeId: string | null, household: string, ingredients: unknown[]) =>
    tx
      .query<{ id: string }>(
        `select public.save_household_recipe($1, $2, 'Arroz de la casa', 'side', 4::smallint, 20::smallint,
           array['Lavar', 'Cocinar']::text[], $3::jsonb) as id`,
        [recipeId, household, JSON.stringify(ingredients)],
      )
      .then((result) => result.rows[0]!.id);

  const ingredientId = async (name: string) =>
    (await db.query<{ id: string }>("select id from public.ingredients where name = $1", [name])).rows[0]!.id;

  it("crea la receta con sus ingredientes en orden y luego los reemplaza al editar", async () => {
    const rice = await ingredientId("Arroz");
    const oil = await ingredientId("Aceite vegetal");
    const recipeId = await asUser(db, ANA, (tx) =>
      save(tx, null, anaHousehold, [
        { ingredient_id: rice, quantity: 1, unit: "lb", note: "" },
        { ingredient_id: oil, quantity: 1, unit: "tbsp", note: "para sofreír" },
      ]),
    );
    const items = await db.query<{ position: number; note: string | null }>(
      "select position, note from public.recipe_ingredients where recipe_id = $1 order by position",
      [recipeId],
    );
    expect(items.rows).toEqual([
      { position: 0, note: null },
      { position: 1, note: "para sofreír" },
    ]);

    await asUser(db, ANA, (tx) =>
      save(tx, recipeId, anaHousehold, [{ ingredient_id: oil, quantity: 2, unit: "tbsp" }]),
    );
    expect(await count(db, "select 1 from public.recipe_ingredients where recipe_id = $1", [recipeId])).toBe(
      1,
    );
  });

  it("no deja guardar en otro hogar ni editar recetas globales", async () => {
    const rice = await ingredientId("Arroz");
    const ajiaco = (await db.query<{ id: string }>("select id from public.recipes where name = 'Ajiaco'"))
      .rows[0]!.id;
    await expect(
      asUser(db, BETO, (tx) =>
        save(tx, null, anaHousehold, [{ ingredient_id: rice, quantity: 1, unit: "lb" }]),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      asUser(db, ANA, (tx) =>
        save(tx, ajiaco, anaHousehold, [{ ingredient_id: rice, quantity: 1, unit: "lb" }]),
      ),
    ).rejects.toThrow("Receta no encontrada en este hogar");
  });

  it("exige al menos un ingrediente y no deja la receta a medias", async () => {
    const before = await count(db, "select 1 from public.recipes");
    await expect(asUser(db, ANA, (tx) => save(tx, null, anaHousehold, []))).rejects.toThrow(
      "al menos un ingrediente",
    );
    expect(await count(db, "select 1 from public.recipes")).toBe(before);
  });
});

describe("mercado", () => {
  const anaWeek = () =>
    db
      .query<{ id: string }>("select id from public.week_plans where household_id = $1 limit 1", [
        anaHousehold,
      ])
      .then((result) => result.rows[0]!.id);

  it("registra compras y extras solo en semanas del propio hogar", async () => {
    const weekId = await anaWeek();
    await asUser(db, ANA, async (tx) => {
      await tx.query(
        `insert into public.shopping_purchases (week_plan_id, ingredient_id, unit, quantity)
         select $1, id, 'g', 500 from public.ingredients where name = 'Arroz'`,
        [weekId],
      );
      await tx.query(
        "insert into public.shopping_extras (week_plan_id, name, category) values ($1, 'Detergente', 'cleaning')",
        [weekId],
      );
    });
    expect(await asUser(db, ANA, (tx) => count(tx, "select 1 from public.shopping_purchases"))).toBe(1);
    expect(await asUser(db, BETO, (tx) => count(tx, "select 1 from public.shopping_purchases"))).toBe(0);
    expect(await asUser(db, BETO, (tx) => count(tx, "select 1 from public.shopping_extras"))).toBe(0);
    await expect(
      asUser(db, BETO, (tx) =>
        tx.query(
          "insert into public.shopping_extras (week_plan_id, name, category) values ($1, 'Intruso', 'cleaning')",
          [weekId],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("una compra por ingrediente y unidad en cada semana", async () => {
    const weekId = await anaWeek();
    await expect(
      asUser(db, ANA, (tx) =>
        tx.query(
          `insert into public.shopping_purchases (week_plan_id, ingredient_id, unit, quantity)
           select $1, id, 'g', 200 from public.ingredients where name = 'Arroz'`,
          [weekId],
        ),
      ),
    ).rejects.toThrow(/duplicate key/);
  });
});
