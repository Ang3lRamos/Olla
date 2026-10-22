"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireHousehold, requireUser } from "./data";
import { householdFormSchema, type HouseholdFormField, type HouseholdFormValues } from "./schemas";

type RawHouseholdForm = Record<HouseholdFormField, string>;

export interface HouseholdFormState {
  saved?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<HouseholdFormField, string>>;
  /** Lo que el usuario escribió, para no perderlo si algo falla. */
  values?: RawHouseholdForm;
}

const SAVE_ERROR = "No pudimos guardar los cambios. Revisa tu conexión y vuelve a intentarlo.";

function readForm(formData: FormData): RawHouseholdForm {
  const read = (field: HouseholdFormField) => String(formData.get(field) ?? "");
  return {
    name: read("name"),
    defaultPeople: read("defaultPeople"),
    weeklyBudgetCop: read("weeklyBudgetCop"),
    exclude: read("exclude"),
    detail: read("detail"),
  };
}

function validate(raw: RawHouseholdForm): { values: HouseholdFormValues } | { state: HouseholdFormState } {
  const parsed = householdFormSchema.safeParse(raw);
  if (parsed.success) return { values: parsed.data };

  const { fieldErrors } = z.flattenError(parsed.error);
  const firstErrors = Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
  );
  return { state: { values: raw, fieldErrors: firstErrors } };
}

export async function createHousehold(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  await requireUser();
  const raw = readForm(formData);
  const result = validate(raw);
  if ("state" in result) return result.state;

  const { name, defaultPeople, weeklyBudgetCop, exclude, detail } = result.values;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_household", {
    household_name: name,
    people: defaultPeople,
    // La función acepta null (default en SQL), pero `supabase gen types` no marca opcionales
    // los argumentos con valor por defecto.
    budget_cop: weeklyBudgetCop as number,
    household_preferences: { exclude, detail },
  });
  if (error) return { error: SAVE_ERROR, values: raw };

  redirect("/");
}

export async function updateHousehold(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const household = await requireHousehold();
  const raw = readForm(formData);
  const result = validate(raw);
  if ("state" in result) return result.state;

  const { name, defaultPeople, weeklyBudgetCop, exclude, detail } = result.values;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("households")
    .update({
      name,
      default_people: defaultPeople,
      weekly_budget_cop: weeklyBudgetCop,
      preferences: { ...household.preferences, exclude, detail },
    })
    .eq("id", household.id);
  if (error) return { error: SAVE_ERROR, values: raw };

  revalidatePath("/", "layout");
  return { saved: true };
}
