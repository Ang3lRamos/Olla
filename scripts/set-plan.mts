/**
 * Cambia el plan de un hogar mientras no existan pagos (luego lo hará el webhook de pagos).
 *   npm run plan:set -- correo@ejemplo.com pro 20
 *   npm run plan:set -- correo@ejemplo.com free
 */
import postgres from "postgres";

process.loadEnvFile(".env.local");

const DEFAULT_PRO_DAILY_LIMIT = 20;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en .env.local`);
  return value;
}

const [email, plan, limitArg] = process.argv.slice(2);
if (!email || (plan !== "pro" && plan !== "free")) {
  console.error("Uso: npm run plan:set -- <correo> <pro|free> [consultas por día]");
  process.exit(1);
}
const dailyLimit = plan === "free" ? 0 : Number(limitArg ?? DEFAULT_PRO_DAILY_LIMIT);
if (!Number.isInteger(dailyLimit) || dailyLimit < 0 || dailyLimit > 500) {
  console.error("El límite diario debe ser un entero entre 0 y 500.");
  process.exit(1);
}

const projectRef = new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL")).hostname.split(".")[0];
const sql = postgres({
  host: requireEnv("SUPABASE_POOLER_HOST"),
  port: 5432,
  database: "postgres",
  username: `postgres.${projectRef}`,
  password: requireEnv("SUPABASE_DB_PASSWORD"),
  ssl: "require",
  max: 1,
});

const rows = await sql`
  insert into public.household_entitlements (household_id, plan, ai_daily_limit, updated_at)
  select m.household_id, ${plan}, ${dailyLimit}, now()
  from public.household_members m join auth.users u on u.id = m.user_id
  where u.email = ${email.toLowerCase()}
  on conflict (household_id) do update
    set plan = excluded.plan, ai_daily_limit = excluded.ai_daily_limit, updated_at = now()
  returning household_id`;
await sql.end();

if (rows.length === 0) {
  console.error(`No hay un hogar para ${email}.`);
  process.exit(1);
}
console.log(`${email}: plan ${plan}${plan === "pro" ? `, ${dailyLimit} consultas al día` : ""}.`);
