import { describe, expect, it } from "vitest";
import { invitePath, inviteTokenFrom } from "./invite-link";

const TOKEN = "3f1c2b8e-6a1d-4c3e-9b2a-1f0e9d8c7b6a";

describe("inviteTokenFrom", () => {
  it("saca el código de la ruta de invitación", () => {
    expect(inviteTokenFrom(invitePath(TOKEN))).toBe(TOKEN);
  });

  it("ignora otras rutas o códigos que no son válidos", () => {
    expect(inviteTokenFrom("/semana")).toBeNull();
    expect(inviteTokenFrom("/unirme?codigo=hola")).toBeNull();
    expect(inviteTokenFrom(null)).toBeNull();
  });
});
