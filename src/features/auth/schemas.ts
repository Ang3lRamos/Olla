import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;

export const credentialsSchema = z.object({
  email: z.email({ error: "Escribe un correo válido." }).trim().toLowerCase(),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
});

export type CredentialsField = keyof z.infer<typeof credentialsSchema>;

/** Solo rutas internas: evita que `?siguiente=` sirva para redirigir a otro sitio. */
export function safeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export const newPasswordSchema = z
  .object({
    password: credentialsSchema.shape.password,
    confirm: z.string(),
  })
  .refine((input) => input.password === input.confirm, {
    message: "Las dos contraseñas no coinciden.",
    path: ["confirm"],
  });
