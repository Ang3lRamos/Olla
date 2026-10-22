import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { authErrorMessage } from "./errors";

describe("authErrorMessage", () => {
  it("traduce los códigos conocidos", () => {
    expect(authErrorMessage(new AuthApiError("Invalid login", 400, "invalid_credentials"))).toBe(
      "El correo o la contraseña no coinciden.",
    );
  });

  it("explica la caída del servicio (p. ej. un 504 por SMTP) y la registra en el servidor", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(authErrorMessage(new AuthRetryableFetchError("Gateway Timeout", 504))).toMatch(/tardó demasiado/);
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  it("usa un mensaje genérico para errores desconocidos del cliente", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(authErrorMessage(new AuthApiError("Raro", 400, "algo_nuevo"))).toMatch(/No pudimos completar/);
    log.mockRestore();
  });
});
