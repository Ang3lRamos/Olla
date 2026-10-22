"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONFIRMATION_PATH } from "./confirmation";
import { authErrorMessage } from "./errors";
import { credentialsSchema, safeRedirectPath, type CredentialsField } from "./schemas";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<CredentialsField, string>>;
  email?: string;
  /** Registro hecho, pero el proyecto pide confirmar el correo antes de ingresar. */
  needsConfirmation?: boolean;
}

function parseCredentials(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (parsed.success) return { credentials: parsed.data } as const;

  const { fieldErrors } = z.flattenError(parsed.error);
  return {
    state: {
      email: String(formData.get("email") ?? ""),
      fieldErrors: { email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] },
    } satisfies AuthFormState,
  } as const;
}

export async function signIn(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = parseCredentials(formData);
  if (!parsed.credentials) return parsed.state;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.credentials);
  if (error) return { email: parsed.credentials.email, error: authErrorMessage(error) };

  redirect(safeRedirectPath(formData.get("siguiente")));
}

export async function signUp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = parseCredentials(formData);
  if (!parsed.credentials) return parsed.state;

  const supabase = await createSupabaseServerClient();
  // El enlace del correo vuelve al mismo dominio del registro (local, vista previa o producción).
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    ...parsed.credentials,
    options: origin ? { emailRedirectTo: `${origin}${CONFIRMATION_PATH}` } : undefined,
  });
  if (error) return { email: parsed.credentials.email, error: authErrorMessage(error) };
  if (!data.session) return { email: parsed.credentials.email, needsConfirmation: true };

  redirect("/empezar");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
