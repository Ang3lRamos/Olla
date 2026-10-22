import { z } from "zod";
import { isIsoDate, MEALS } from "@/domain/week";

export const MAX_NOTE_LENGTH = 1000;

export const noteSchema = z.object({
  id: z.uuid().nullable(),
  date: z.string().refine(isIsoDate, "Fecha inválida."),
  meal: z.enum(MEALS).nullable(),
  body: z
    .string()
    .trim()
    .min(1, "Escribe algo en la nota.")
    .max(MAX_NOTE_LENGTH, `La nota puede tener hasta ${MAX_NOTE_LENGTH} caracteres.`),
});

export type NoteInput = z.input<typeof noteSchema>;
