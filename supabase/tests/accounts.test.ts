import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { asServer, asUser, createTestDatabase, createUser } from "./test-database";

const CARLA = "00000000-0000-0000-0000-0000000000c1";

let db: PGlite;
let household: string;
let reference: string;

beforeAll(async () => {
  db = await createTestDatabase();
  await createUser(db, CARLA);
  household = await asUser(db, CARLA, (tx) =>
    tx
      .query<{ id: string }>(
        "select public.create_household('Casa de Carla', 2::smallint, null, '{}'::jsonb) as id",
      )
      .then((result) => result.rows[0]!.id),
  );
  reference = await asUser(db, CARLA, (tx) =>
    tx
      .query<{ reference: string }>("select reference from public.create_payment($1, 'pro', 'month')", [
        household,
      ])
      .then((result) => result.rows[0]!.reference),
  );
});

describe("permisos", () => {
  it("sin sesión no se lee ninguna tabla", async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        return tx.query("select id from public.households");
      }),
    ).rejects.toThrow(/permission denied/);
  });

  it("con sesión no se puede vaciar una tabla", async () => {
    await expect(asUser(db, CARLA, (tx) => tx.exec("truncate public.notes"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("un usuario no marca reembolsos por su cuenta", async () => {
    await asUser(db, CARLA, (tx) =>
      tx.query("update public.payments set refunded_at = now() where reference = $1", [reference]),
    );
    const { rows } = await db.query<{ refunded_at: Date | null }>(
      "select refunded_at from public.payments where reference = $1",
      [reference],
    );
    expect(rows[0]!.refunded_at).toBeNull();
  });
});

describe("borrar la cuenta", () => {
  it("se lleva el hogar pero conserva el pago, sin hogar", async () => {
    await db.query("delete from auth.users where id = $1", [CARLA]);
    const households = await db.query("select id from public.households where id = $1", [household]);
    expect(households.rows).toHaveLength(0);
    const payments = await db.query<{ household_id: string | null }>(
      "select household_id from public.payments where reference = $1",
      [reference],
    );
    expect(payments.rows).toEqual([{ household_id: null }]);
  });

  it("si Wompi aprueba después, registra el estado sin fallar", async () => {
    const result = await asServer(db, (tx) =>
      tx.query<{ status: string; plan: string | null }>(
        "select * from public.apply_payment($1, 'tx-borrado', 'APPROVED', 1990000, 'COP', 'CARD')",
        [reference],
      ),
    );
    expect(result.rows[0]).toMatchObject({ status: "APPROVED", plan: null });
  });
});
