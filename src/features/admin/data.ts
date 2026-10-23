import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminAiUsage, AdminEntitlement, AdminPayment, AdminUser } from "./metrics";

const USERS_PER_PAGE = 1000;

export interface AdminSnapshot {
  users: AdminUser[];
  households: Map<string, string>;
  entitlements: AdminEntitlement[];
  payments: AdminPayment[];
  aiUsage: AdminAiUsage[];
}

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

async function listAllUsers(admin: AdminClient) {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE });
    if (error) throw new Error(`No se pudieron leer los usuarios: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < USERS_PER_PAGE) return users;
  }
}

const failIf = (error: { message: string } | null, what: string) => {
  if (error) throw new Error(`No se pudo leer ${what}: ${error.message}`);
};

/** Todo lo que el panel necesita, leído con la llave de servicio (salta la RLS). null sin la llave. */
export async function loadAdminSnapshot(): Promise<AdminSnapshot | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const [authUsers, members, households, entitlements, payments, aiUsage] = await Promise.all([
    listAllUsers(admin),
    admin.from("household_members").select("user_id, household_id"),
    admin.from("households").select("id, name"),
    admin.from("household_entitlements").select("household_id, plan, expires_at"),
    admin
      .from("payments")
      .select(
        "reference, household_id, plan, period, amount_in_cents, status, payment_method_type, created_at",
      )
      .order("created_at", { ascending: false }),
    admin.from("ai_usage").select("household_id, used_on, requests"),
  ]);
  failIf(members.error, "los hogares");
  failIf(households.error, "los hogares");
  failIf(entitlements.error, "los planes");
  failIf(payments.error, "los pagos");
  failIf(aiUsage.error, "el uso del asistente");

  const householdOf = new Map((members.data ?? []).map((row) => [row.user_id, row.household_id]));
  return {
    users: authUsers.map((user) => ({
      id: user.id,
      email: user.email ?? "(sin correo)",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      confirmed: Boolean(user.email_confirmed_at),
      householdId: householdOf.get(user.id) ?? null,
    })),
    households: new Map((households.data ?? []).map((row) => [row.id, row.name])),
    entitlements: (entitlements.data ?? []).map((row) => ({
      householdId: row.household_id,
      plan: row.plan as AdminEntitlement["plan"],
      expiresAt: row.expires_at,
    })),
    payments: (payments.data ?? []).map((row) => ({
      reference: row.reference,
      householdId: row.household_id,
      plan: row.plan as AdminPayment["plan"],
      period: row.period as AdminPayment["period"],
      amountCop: Math.round(row.amount_in_cents / 100),
      status: row.status as AdminPayment["status"],
      method: row.payment_method_type,
      createdAt: row.created_at,
    })),
    aiUsage: (aiUsage.data ?? []).map((row) => ({
      householdId: row.household_id,
      usedOn: row.used_on,
      requests: row.requests,
    })),
  };
}
