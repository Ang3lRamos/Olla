import "server-only";
import { z } from "zod";
import { MEALS, type IsoDate, type Meal } from "@/domain/week";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface Note {
  id: string;
  date: IsoDate;
  meal: Meal | null;
  body: string;
  createdAt: string;
}

const noteRowSchema = z
  .object({
    id: z.string(),
    date: z.string(),
    meal: z.enum(MEALS).nullable(),
    body: z.string(),
    created_at: z.string(),
  })
  .transform((row): Note => ({
    id: row.id,
    date: row.date,
    meal: row.meal,
    body: row.body,
    createdAt: row.created_at,
  }));

const NOTE_COLUMNS = "id, date, meal, body, created_at";

export async function listNotesBetween(from: IsoDate, to: IsoDate): Promise<Note[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .gte("date", from)
    .lte("date", to)
    .order("created_at");
  if (error) throw new Error(`No se pudieron leer las notas: ${error.message}`);
  return z.array(noteRowSchema).parse(data);
}

export async function listRecentNotes(limit: number): Promise<Note[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`No se pudieron leer las notas: ${error.message}`);
  return z.array(noteRowSchema).parse(data);
}
