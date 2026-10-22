import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { householdPreferencesSchema, type HouseholdPreferences } from "./schemas";

export interface CurrentUser {
  id: string;
  email: string | null;
}

export interface Household {
  id: string;
  name: string;
  defaultPeople: number;
  weeklyBudgetCop: number | null;
  preferences: HouseholdPreferences;
}

/** Identidad verificada (firma del JWT), compartida por todos los componentes de la petición. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return null;
  return { id: data.claims.sub, email: data.claims.email ?? null };
});

/** En la v1 cada usuario pertenece a un hogar; la RLS solo devuelve los suyos. */
export const getCurrentHousehold = cache(async (): Promise<Household | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("households")
    .select("id, name, default_people, weekly_budget_cop, preferences")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el hogar: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    defaultPeople: data.default_people,
    weeklyBudgetCop: data.weekly_budget_cop,
    preferences: householdPreferencesSchema.parse(data.preferences ?? {}),
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  return user;
}

export async function requireHousehold(): Promise<Household> {
  await requireUser();
  const household = await getCurrentHousehold();
  if (!household) redirect("/empezar");
  return household;
}
