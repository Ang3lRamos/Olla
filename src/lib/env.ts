import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    error: "NEXT_PUBLIC_SUPABASE_URL debe ser la URL del proyecto de Supabase",
  }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local" })
    .min(1, "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local"),
});

// Next solo incrusta en el navegador las variables leídas de forma literal.
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
