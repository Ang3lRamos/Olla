import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestDatabase, createUser } from "./test-database";

const EVA = "00000000-0000-0000-0000-0000000000e1";
let db: PGlite;
let household: string;

const call = <T>(sql: string) =>
  asUser(db, EVA, (tx) => tx.query<T>(sql, [household]).then((result) => result.rows[0]!));
const consume = () =>
  call<{ ok: boolean }>("select public.consume_free_weekly_menu($1) as ok").then((r) => r.ok);
const available = () =>
  call<{ free_menu_available: boolean }>("select free_menu_available from public.get_ai_quota($1)").then(
    (r) => r.free_menu_available,
  );

beforeAll(async () => {
  db = await createTestDatabase();
  await createUser(db, EVA);
  household = await asUser(db, EVA, (tx) =>
    tx
      .query<{ id: string }>(
        "select public.create_household('Casa de Eva', 2::smallint, null, '{}'::jsonb) as id",
      )
      .then((result) => result.rows[0]!.id),
  );
});

describe("menú gratis semanal", () => {
  it("en Gratis hay uno por semana", async () => {
    expect(await available()).toBe(true);
    expect(await consume()).toBe(true);
    expect(await available()).toBe(false);
    expect(await consume()).toBe(false);
  });

  it("si la IA falla se devuelve", async () => {
    await call("select public.refund_free_weekly_menu($1)");
    expect(await available()).toBe(true);
  });

  it("la semana siguiente vuelve a estar disponible", async () => {
    await consume();
    await db.query(
      "update public.free_weekly_menus set week_start = week_start - 7 where household_id = $1",
      [household],
    );
    expect(await available()).toBe(true);
  });

  it("con plan pago no aplica: se usa el cupo diario", async () => {
    await db.query(
      "insert into public.household_entitlements (household_id, plan, ai_daily_limit, expires_at) values ($1, 'basic', 5, now() + interval '30 days')",
      [household],
    );
    expect(await available()).toBe(false);
    expect(await consume()).toBe(false);
  });
});
