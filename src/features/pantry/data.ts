import "server-only";
import { z } from "zod";
import type { Quantity } from "@/domain/types";
import { UNITS } from "@/domain/units";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PantryEntry {
  id: string;
  ingredientId: string;
  quantity: Quantity;
}

const pantryRowSchema = z
  .object({ id: z.string(), ingredient_id: z.string(), quantity: z.number(), unit: z.enum(UNITS) })
  .transform((row): PantryEntry => ({
    id: row.id,
    ingredientId: row.ingredient_id,
    quantity: { amount: row.quantity, unit: row.unit },
  }));

export async function listPantry(): Promise<PantryEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("pantry_items").select("id, ingredient_id, quantity, unit");
  if (error) throw new Error(`No se pudo leer la despensa: ${error.message}`);
  return z.array(pantryRowSchema).parse(data);
}
