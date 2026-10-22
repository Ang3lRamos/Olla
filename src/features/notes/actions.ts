"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold } from "@/features/household/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { noteSchema, type NoteInput } from "./schemas";

export type NoteActionResult = { ok: true } | { ok: false; error: string };

const SAVE_ERROR = "No pudimos guardar la nota. Revisa tu conexión y vuelve a intentarlo.";

function revalidateNotes() {
  revalidatePath("/semana");
  revalidatePath("/notas");
}

export async function saveNote(input: NoteInput): Promise<NoteActionResult> {
  const household = await requireHousehold();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? SAVE_ERROR };

  const { id, date, meal, body } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = id
    ? await supabase.from("notes").update({ body }).eq("id", id).eq("household_id", household.id)
    : await supabase.from("notes").insert({ household_id: household.id, date, meal, body });
  if (error) return { ok: false, error: SAVE_ERROR };

  revalidateNotes();
  return { ok: true };
}

export async function deleteNote(noteId: string): Promise<NoteActionResult> {
  const household = await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notes").delete().eq("id", noteId).eq("household_id", household.id);
  if (error) return { ok: false, error: "No pudimos borrar la nota. Vuelve a intentarlo." };

  revalidateNotes();
  return { ok: true };
}
