import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface HouseholdMember {
  userId: string;
  email: string;
  role: "owner" | "member";
}

export interface HouseholdInvite {
  token: string;
  expiresAt: string;
}

export interface InvitePreview {
  householdName: string;
  members: number;
  expiresAt: string;
}

export async function listMembers(householdId: string): Promise<HouseholdMember[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_household_members", { target_household_id: householdId });
  if (error) throw new Error(`No se pudieron leer las personas del hogar: ${error.message}`);
  return data.map((row) => ({
    userId: row.user_id,
    email: row.email,
    role: row.role === "owner" ? "owner" : "member",
  }));
}

/** Invitaciones sin usar y sin vencer; la RLS solo deja ver las del hogar propio. */
export async function listInvites(householdId: string): Promise<HouseholdInvite[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("household_invites")
    .select("token, expires_at")
    .eq("household_id", householdId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at");
  if (error) throw new Error(`No se pudieron leer las invitaciones: ${error.message}`);
  return data.map((row) => ({ token: row.token, expiresAt: row.expires_at }));
}

/** null si el enlace no existe, ya se usó o venció. */
export async function previewInvite(token: string): Promise<InvitePreview | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("preview_household_invite", { target_token: token });
  if (error) return null;
  const [row] = data;
  return row ? { householdName: row.household_name, members: row.members, expiresAt: row.expires_at } : null;
}
