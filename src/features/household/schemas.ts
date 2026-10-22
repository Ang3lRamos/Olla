import { z } from "zod";
import { DETAIL_LEVELS } from "@/domain/detail-level";

export const MAX_PEOPLE = 20;
export const MAX_EXCLUSIONS = 20;
const MAX_BUDGET_COP = 100_000_000;

/** "cerdo, maní\nMariscos" -> ["cerdo", "maní", "Mariscos"], sin vacíos ni repetidos. */
export function parseExclusions(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(/[,\n]/)
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter((item) => {
      const key = item.toLocaleLowerCase("es");
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Acepta "200.000", "$ 200000" o vacío (sin presupuesto). */
export function parseBudget(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  return digits === "" ? null : Number(digits);
}

export const householdFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ponle un nombre a tu hogar.")
    .max(80, "El nombre puede tener hasta 80 caracteres."),
  defaultPeople: z.coerce
    .number<string>()
    .int()
    .min(1, "Debe comer al menos una persona.")
    .max(MAX_PEOPLE, `Hasta ${MAX_PEOPLE} personas.`),
  weeklyBudgetCop: z
    .string()
    .transform(parseBudget)
    .pipe(z.number().max(MAX_BUDGET_COP, "Ese presupuesto parece demasiado alto.").nullable()),
  exclude: z
    .string()
    .transform(parseExclusions)
    .pipe(
      z
        .array(z.string().max(40, "Cada elemento puede tener hasta 40 caracteres."))
        .max(MAX_EXCLUSIONS, `Hasta ${MAX_EXCLUSIONS} elementos.`),
    ),
  detail: z.enum(DETAIL_LEVELS).catch("simple"),
});

export type HouseholdFormValues = z.output<typeof householdFormSchema>;
export type HouseholdFormField = keyof HouseholdFormValues;

export const householdPreferencesSchema = z.object({
  exclude: z.array(z.string()).catch([]),
  /** Sencillo por defecto: los hogares que existían antes de los modos siguen igual de simples. */
  detail: z.enum(DETAIL_LEVELS).catch("simple"),
});

export type HouseholdPreferences = z.infer<typeof householdPreferencesSchema>;
