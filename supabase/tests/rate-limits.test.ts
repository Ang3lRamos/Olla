import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { asServer, asUser, createTestDatabase, createUser } from "./test-database";

const DANI = "00000000-0000-0000-0000-0000000000d1";
let db: PGlite;

const hit = (bucket: string, max = 3, windowSeconds = 60) =>
  asServer(db, (tx) =>
    tx
      .query<{ allowed: boolean }>("select public.hit_rate_limit($1, $2, $3) as allowed", [
        bucket,
        max,
        windowSeconds,
      ])
      .then((result) => result.rows[0]!.allowed),
  );

beforeAll(async () => {
  db = await createTestDatabase();
  await createUser(db, DANI);
});

describe("hit_rate_limit", () => {
  it("deja pasar hasta el tope de la ventana y después no", async () => {
    expect([await hit("user:a"), await hit("user:a"), await hit("user:a"), await hit("user:a")]).toEqual([
      true,
      true,
      true,
      false,
    ]);
    // Cada clave lleva su cuenta.
    expect(await hit("user:b")).toBe(true);
  });

  it("al pasar la ventana vuelve a empezar", async () => {
    await db.query(
      "update public.rate_limits set window_start = now() - interval '2 minutes' where bucket = 'user:a'",
    );
    expect(await hit("user:a")).toBe(true);
  });

  it("un usuario no puede contar por otro", async () => {
    await expect(
      asUser(db, DANI, (tx) => tx.query("select public.hit_rate_limit('user:a', 1, 60)")),
    ).rejects.toThrow(/permission denied/);
  });
});
