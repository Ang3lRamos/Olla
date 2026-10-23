"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONFIRMATION_PATH } from "./confirmation";
import { authErrorMessage } from "./errors";
import { credentialsSchema, safeRedirectPath, type CredentialsField } from "./schemas";
import { HOME_PATH } from "@/lib/routes";
import { LEGAL_VERSION } from "@/features/legal/owner";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<CredentialsField | "terms", string>>;
  email?: string;
  /** Registro hecho, pero el proyecto pide confirmar el correo antes de ingresar. */
  needsConfirmation?: boolean;
}

export interface ResendState {
  /** Momento del último reenvío; reinicia la espera del botón. */
  sentAt?: number;
  error?: string;
}

/** El enlace del correo vuelve al mismo dominio del registro (local, vista previa o producción). */
async function confirmationLinkOptions() {
  const origin = (await headers()).get("origin");
  return origin ? { emailRedirectTo: `${origin}${CONFIRMATION_PATH}` } : undefined;
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

  // Quien aún no configuró su hogar va directo al onboarding, sin pasar por una página
  // que lo redirigiría después de empezar a cargar.
  const { data: household } = await supabase.from("households").select("id").limit(1).maybeSingle();
  const next = safeRedirectPath(formData.get("siguiente"));
  redirect(household ? (next === "/" ? HOME_PATH : next) : "/empezar");
}

export async function signUp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = parseCredentials(formData);
  const acceptedTerms = formData.get("terms") === "on";
  if (!parsed.credentials || !acceptedTerms) {
    return {
      email: String(formData.get("email") ?? ""),
      ...parsed.state,
      fieldErrors: {
        ...parsed.state?.fieldErrors,
        terms: acceptedTerms ? undefined : "Para crear la cuenta, acepta los términos y la política.",
      },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.credentials,
    options: {
      ...(await confirmationLinkOptions()),
      // Prueba de la autorización (Ley 1581): qué versión aceptó y cuándo.
      data: { legal_version: LEGAL_VERSION, legal_accepted_at: new Date().toISOString() },
    },
  });
  if (error) return { email: parsed.credentials.email, error: authErrorMessage(error) };
  if (!data.session) return { email: parsed.credentials.email, needsConfirmation: true };

  redirect("/empezar");
}

export async function resendConfirmation(_: ResendState, formData: FormData): Promise<ResendState> {
  const email = credentialsSchema.shape.email.safeParse(formData.get("email"));
  if (!email.success) return { error: "No reconocemos ese correo. Vuelve a registrarte." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: await confirmationLinkOptions(),
  });
  return error ? { error: authErrorMessage(error) } : { sentAt: Date.now() };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
