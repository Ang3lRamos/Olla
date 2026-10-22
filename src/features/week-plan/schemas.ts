import { z } from "zod";
import { isIsoDate, MEALS, startOfWeek } from "@/domain/week";
import { MAX_PEOPLE } from "@/features/household/schemas";

export const weekStartSchema = z
  .string()
  .refine((value) => isIsoDate(value) && startOfWeek(value) === value, "La semana debe empezar en lunes.");

export const slotKeySchema = z.object({
  weekStart: weekStartSchema,
  day: z.number().int().min(0).max(6),
  meal: z.enum(MEALS),
});

export const assignMealSchema = slotKeySchema.extend({
  recipeId: z.uuid(),
  peopleOverride: z.number().int().min(1).max(MAX_PEOPLE).nullable(),
});

export const weekPeopleSchema = z.object({
  weekStart: weekStartSchema,
  people: z.number().int().min(1).max(MAX_PEOPLE),
});

export const mealChangesSchema = z.object({
  weekStart: weekStartSchema,
  changes: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        meal: z.enum(MEALS),
        /** null = vaciar la casilla. */
        recipeId: z.uuid().nullable(),
      }),
    )
    .min(1)
    .max(21),
});

export type SlotKey = z.infer<typeof slotKeySchema>;
export type AssignMealInput = z.infer<typeof assignMealSchema>;
export type MealChangesInput = z.infer<typeof mealChangesSchema>;
