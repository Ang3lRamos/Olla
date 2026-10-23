import { z } from "zod";
import { MEALS, type Meal } from "@/domain/week";

export const ASSISTANT_MODES = ["propose", "adjust", "review-notes"] as const;
export type AssistantMode = (typeof ASSISTANT_MODES)[number];

/** Los modelos a veces responden la comida en español; se acepta y se normaliza. */
const MEAL_SYNONYMS: Record<string, Meal> = {
  desayuno: "breakfast",
  almuerzo: "lunch",
  comida: "dinner",
  cena: "dinner",
};

const mealSchema = z.preprocess(
  (value) =>
    typeof value === "string"
      ? (MEAL_SYNONYMS[value.trim().toLowerCase()] ?? value.trim().toLowerCase())
      : value,
  z.enum(MEALS),
);

/** Lo que se le pide a la IA: solo ids de recetas por casilla, nunca cantidades ni costos. */
export const aiProposalSchema = z.object({
  summary: z.string().trim().min(1).max(600),
  changes: z
    .array(
      z.object({
        day: z.coerce.number().int().min(0).max(6),
        meal: mealSchema,
        /** null = dejar la casilla vacía. */
        recipeId: z.string().trim().min(1).nullable(),
        reason: z.string().trim().max(240).optional(),
      }),
    )
    .max(21),
});

export type AiProposal = z.infer<typeof aiProposalSchema>;

export const assistantRequestSchema = z.object({
  weekStart: z.string(),
  mode: z.enum(ASSISTANT_MODES),
  instruction: z.string().trim().max(400).default(""),
  onlyEmpty: z.boolean().default(true),
  /** Lo que la persona compró o tiene y quiere usar esta semana (nombres del catálogo). */
  focus: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
});

export type AssistantRequest = z.input<typeof assistantRequestSchema>;
