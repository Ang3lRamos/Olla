/**
 * Ejecuta el CLI de Supabase contra el proyecto remoto con la contraseña de .env.local,
 * sin necesidad de `supabase login`.
 *   tsx scripts/supabase-remote.ts push   -> aplica migraciones pendientes y la semilla
 *   tsx scripts/supabase-remote.ts types  -> regenera src/lib/supabase/database.types.ts
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

process.loadEnvFile(".env.local");

const TYPES_FILE = "src/lib/supabase/database.types.ts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en .env.local (ver .env.example)`);
  return value;
}

function databaseUrl(): string {
  const projectRef = new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL")).hostname.split(".")[0];
  const password = encodeURIComponent(requireEnv("SUPABASE_DB_PASSWORD"));
  const host = requireEnv("SUPABASE_POOLER_HOST");
  return `postgresql://postgres.${projectRef}:${password}@${host}:5432/postgres`;
}

// Se invoca con Node directamente, sin shell, para que la contraseña no pase por cmd/sh.
const SUPABASE_CLI = "node_modules/supabase/dist/supabase.js";

function runSupabase(args: string[], captureOutput: boolean) {
  const result = spawnSync(process.execPath, [SUPABASE_CLI, ...args, "--db-url", databaseUrl()], {
    stdio: ["inherit", captureOutput ? "pipe" : "inherit", "inherit"],
    encoding: "utf8",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result.stdout;
}

const COMMANDS: Record<string, () => void> = {
  push: () => runSupabase(["db", "push", "--include-seed", "--yes"], false),
  types: () => {
    const types = runSupabase(["gen", "types", "typescript", "--schema", "public"], true);
    writeFileSync(TYPES_FILE, types);
  },
};

const command = COMMANDS[process.argv[2] ?? ""];
if (!command) {
  console.error(`Uso: tsx scripts/supabase-remote.ts <${Object.keys(COMMANDS).join("|")}>`);
  process.exit(1);
}
command();
