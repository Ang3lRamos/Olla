import type { PGlite, Transaction } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { asServer, asUser, createTestDatabase, createUser } from "./test-database";

const ANA = "00000000-0000-0000-0000-0000000000a1";
const BETO = "00000000-0000-0000-0000-0000000000b1";

let db: PGlite;
let household: string;

const createHousehold = (tx: Transaction, name: string) =>
  tx
    .query<{ id: string }>("select public.create_household($1, 4::smallint, null, '{}'::jsonb) as id", [name])
    .then((result) => result.rows[0]!.id);

const createPayment = (plan: string, period: string) =>
  asUser(db, ANA, (tx) =>
    tx
      .query<{ reference: string; amount_in_cents: string }>(
        "select * from public.create_payment($1, $2, $3)",
        [household, plan, period],
      )
      .then((result) => result.rows[0]!),
  );

const apply = (
  reference: string,
  status: string,
  amount: number | string,
  transactionId = `tx-${reference}`,
) =>
  asServer(db, (tx) =>
    tx
      .query<{ status: string; plan: string | null; expires_at: Date | null }>(
        "select * from public.apply_payment($1, $2, $3, $4, 'COP', 'PSE')",
        [reference, transactionId, status, amount],
      )
      .then((result) => result.rows[0]!),
  );

const quota = () =>
  asUser(db, ANA, (tx) =>
    tx
      .query<{ plan: string; daily_limit: number | null; expires_at: Date | null; trial_used: boolean }>(
        "select * from public.get_ai_quota($1)",
        [household],
      )
      .then((result) => result.rows[0]!),
  );

const daysFromNow = (date: Date | null) => Math.round(((date?.getTime() ?? 0) - Date.now()) / 86_400_000);

beforeAll(async () => {
  db = await createTestDatabase();
  await createUser(db, ANA);
  await createUser(db, BETO);
  household = await asUser(db, ANA, (tx) => createHousehold(tx, "Casa de Ana"));
  await asUser(db, BETO, (tx) => createHousehold(tx, "Casa de Beto"));
});

describe("pagos", () => {
  it("el monto lo fija la base según el plan", async () => {
    expect(Number((await createPayment("pro", "month")).amount_in_cents)).toBe(1_990_000);
    expect(Number((await createPayment("basic", "quarter")).amount_in_cents)).toBe(2_490_000);
    await expect(createPayment("pro", "year")).rejects.toThrow("Plan no válido");
  });

  it("nadie paga por un hogar ajeno", async () => {
    await expect(
      asUser(db, BETO, (tx) =>
        tx.query("select * from public.create_payment($1, 'pro', 'month')", [household]),
      ),
    ).rejects.toThrow("No perteneces a este hogar");
  });

  it("un usuario no puede activar su plan sin pasar por el servidor", async () => {
    const { reference } = await createPayment("pro", "month");
    await expect(
      asUser(db, ANA, (tx) =>
        tx.query("select * from public.apply_payment($1, 'x', 'APPROVED', 1990000, 'COP', 'CARD')", [
          reference,
        ]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("un pago rechazado o por otro monto no activa nada", async () => {
    const declined = await createPayment("pro", "month");
    expect(await apply(declined.reference, "DECLINED", declined.amount_in_cents)).toMatchObject({
      status: "DECLINED",
    });
    const cheap = await createPayment("pro", "month");
    await apply(cheap.reference, "APPROVED", 100);
    expect((await quota()).plan).toBe("free");
  });

  it("un pago aprobado activa el plan por su periodo, una sola vez", async () => {
    const { reference, amount_in_cents } = await createPayment("basic", "month");
    const result = await apply(reference, "APPROVED", amount_in_cents);
    expect(result).toMatchObject({ status: "APPROVED", plan: "basic" });
    expect(daysFromNow(result.expires_at)).toBe(30);
    // El aviso de Wompi y la vuelta del usuario pueden llegar los dos: no se cobra doble.
    expect(daysFromNow((await apply(reference, "APPROVED", amount_in_cents)).expires_at)).toBe(30);
    expect(await quota()).toMatchObject({ plan: "basic", daily_limit: 5 });
  });

  it("renovar el mismo plan suma al final; cambiar de plan empieza hoy", async () => {
    const renewal = await createPayment("basic", "quarter");
    expect(
      daysFromNow((await apply(renewal.reference, "APPROVED", renewal.amount_in_cents)).expires_at),
    ).toBe(120);
    const upgrade = await createPayment("pro", "month");
    const result = await apply(upgrade.reference, "APPROVED", upgrade.amount_in_cents);
    expect(result.plan).toBe("pro");
    expect(daysFromNow(result.expires_at)).toBe(30);
  });

  it("al vencer vuelve a gratis sin tocar la fila", async () => {
    await db.query(
      "update public.household_entitlements set expires_at = now() - interval '1 minute' where household_id = $1",
      [household],
    );
    expect(await quota()).toMatchObject({ plan: "free", daily_limit: 0, expires_at: null });
  });

  it("no pisa un plan asignado a mano sin vencimiento", async () => {
    await db.query(
      "update public.household_entitlements set plan = 'pro', ai_daily_limit = null, expires_at = null where household_id = $1",
      [household],
    );
    const { reference, amount_in_cents } = await createPayment("basic", "month");
    await apply(reference, "APPROVED", amount_in_cents);
    expect(await quota()).toMatchObject({ plan: "pro", daily_limit: null });
  });
});

describe("prueba gratis", () => {
  it("da 7 días de Pro una sola vez", async () => {
    const beto = await asUser(db, BETO, (tx) =>
      tx
        .query<{ id: string }>("select household_id as id from public.household_members")
        .then((r) => r.rows[0]!.id),
    );
    const start = () =>
      asUser(db, BETO, (tx) =>
        tx.query<{ ok: boolean }>("select public.start_trial($1) as ok", [beto]).then((r) => r.rows[0]!.ok),
      );
    expect(await start()).toBe(true);
    const trial = await asUser(db, BETO, (tx) =>
      tx
        .query<{ plan: string; expires_at: Date }>("select * from public.get_ai_quota($1)", [beto])
        .then((r) => r.rows[0]!),
    );
    expect(trial.plan).toBe("pro");
    expect(daysFromNow(trial.expires_at)).toBe(7);
    expect(await start()).toBe(false);
  });
});
