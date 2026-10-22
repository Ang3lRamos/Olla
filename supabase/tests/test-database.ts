import { readdirSync, readFileSync } from "node:fs";
import { PGlite, type Transaction } from "@electric-sql/pglite";

const SUPABASE_DIR = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, SUPABASE_DIR), "utf8");

export const SEED_SQL = read("seed.sql");

/** Base de datos en memoria con las migraciones aplicadas, como la vería Supabase. */
export async function createTestDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(read("tests/supabase-stubs.sql"));
  for (const file of readdirSync(new URL("migrations/", SUPABASE_DIR)).sort()) {
    await db.exec(read(`migrations/${file}`));
  }
  return db;
}

export async function createUser(db: PGlite, id: string): Promise<string> {
  await db.query("insert into auth.users (id) values ($1)", [id]);
  return id;
}

/** Ejecuta `work` con el rol del servidor (service_role), como el webhook de pagos. */
export async function asServer<T>(db: PGlite, work: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec("set local role service_role");
    return work(tx);
  });
}

/** Ejecuta `work` con el rol y el JWT de un usuario autenticado, como lo hace PostgREST. */
export async function asUser<T>(
  db: PGlite,
  userId: string,
  work: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    return work(tx);
  });
}
