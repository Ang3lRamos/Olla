import { describe, expect, it, vi } from "vitest";
import type { AiClient, AiResult } from "@/lib/ai/types";
import { buildAssistantMessages } from "./prompts";
import type { AiProposal } from "./schemas";
import { aiProposalSchema } from "./schemas";
import { runAssistant } from "./service";
import { createSimulatedAssistantClient } from "./simulated-client";
import { makeContext } from "./test-context";

/** Cliente simulado para las pruebas: devuelve lo que se le indique, sin red. */
function mockClient(result: AiResult<AiProposal>) {
  const completeJson = vi.fn<(request: unknown) => Promise<AiResult<AiProposal>>>(async () => result);
  return { client: { completeJson } as unknown as AiClient, completeJson };
}

const instant = { sleep: async () => undefined };

describe("runAssistant", () => {
  it("sin configuración responde not_configured sin llamar a nada", async () => {
    expect(await runAssistant(null, makeContext())).toMatchObject({
      ok: false,
      error: { kind: "not_configured" },
    });
  });

  it("pide JSON con el esquema de propuesta y depura lo que vuelve", async () => {
    const { client, completeJson } = mockClient({
      ok: true,
      data: {
        summary: "Semana variada",
        changes: [
          { day: 0, meal: "lunch", recipeId: "lentejas" },
          { day: 1, meal: "lunch", recipeId: "frijoles" },
        ],
      },
    });
    const outcome = await runAssistant(client, makeContext());
    expect(outcome).toMatchObject({
      ok: true,
      summary: "Semana variada",
      changes: [{ recipeId: "lentejas" }],
    });
    expect(outcome.ok && outcome.discarded).toEqual([{ day: 1, meal: "lunch", reason: "excluded" }]);
    expect(completeJson.mock.calls[0]![0]).toMatchObject({ schema: aiProposalSchema });
  });

  it.each(["timeout", "unavailable", "invalid_response"] as const)(
    "propaga el error %s sin inventar nada",
    async (kind) => {
      const { client } = mockClient({ ok: false, error: { kind, detail: "x" } });
      expect(await runAssistant(client, makeContext())).toEqual({ ok: false, error: { kind, detail: "x" } });
    },
  );
});

describe("buildAssistantMessages", () => {
  it("incluye reglas, ids del catálogo, exclusiones, presupuesto y la tarea del modo", () => {
    const [system, user] = buildAssistantMessages(
      makeContext({
        mode: "adjust",
        instruction: "cambia el pescado",
        notes: [{ day: 2, meal: "lunch", body: "sobró arroz" }],
      }),
    );
    expect(system!.content).toMatch(/Solo eliges recetas del catálogo/);
    expect(system!.content).toMatch(/No des consejos médicos ni nutricionales/);
    expect(user!.content).toContain("«cambia el pescado»");
    const data = JSON.parse(user!.content.split("Datos del hogar:\n")[1]!);
    expect(data.catalogo.map((recipe: { id: string }) => recipe.id)).toContain("lentejas");
    expect(data).toMatchObject({ no_incluir: ["tocineta"], presupuesto_semanal_cop: 200000 });
    expect(data.notas).toEqual([{ dia: "miércoles", comida: "Almuerzo", texto: "sobró arroz" }]);
  });
});

describe("cliente simulado", () => {
  const run = (overrides: Parameters<typeof makeContext>[0]) => {
    const context = makeContext(overrides);
    return runAssistant(createSimulatedAssistantClient(context, instant), context);
  };

  it("propone las 21 comidas, con desayunos en desayuno y sin lo excluido", async () => {
    const outcome = await run({ onlyEmpty: false });
    expect(outcome.ok && outcome.changes).toHaveLength(21);
    expect(
      outcome.ok &&
        outcome.changes
          .filter((change) => change.meal === "breakfast")
          .every((change) => ["pericos", "calentado", "changua"].includes(change.recipeId!)),
    ).toBe(true);
    expect(outcome.ok && outcome.changes.some((change) => change.recipeId === "frijoles")).toBe(false);
  });

  it("ajusta por plata cambiando lo más caro por algo más barato", async () => {
    const outcome = await run({
      mode: "adjust",
      instruction: "Esta semana estoy corto de plata",
      slots: [
        { day: 0, meal: "lunch", recipeId: "mojarra", peopleOverride: null },
        { day: 1, meal: "lunch", recipeId: "lentejas", peopleOverride: null },
      ],
    });
    expect(outcome.ok && outcome.changes[0]).toMatchObject({ day: 0, meal: "lunch" });
    expect(outcome.ok && outcome.changes[0]!.recipeId).not.toBe("mojarra");
  });

  it("entiende «cambia el pescado» aunque la receta diga mojarra", async () => {
    const outcome = await run({
      mode: "adjust",
      instruction: "cambia el pescado",
      slots: [{ day: 4, meal: "lunch", recipeId: "mojarra", peopleOverride: null }],
    });
    expect(outcome.ok && outcome.changes).toEqual([expect.objectContaining({ day: 4, meal: "lunch" })]);
  });

  it("con las notas aprovecha sobrantes al día siguiente", async () => {
    const outcome = await run({
      mode: "review-notes",
      notes: [{ day: 2, meal: "lunch", body: "Sobró arroz y fríjoles" }],
    });
    expect(outcome.ok && outcome.changes).toEqual([
      expect.objectContaining({ day: 3, meal: "breakfast", recipeId: "calentado" }),
    ]);
  });

  it("permite simular errores para probar la interfaz", async () => {
    expect(await run({ mode: "adjust", instruction: "simular error" })).toMatchObject({
      ok: false,
      error: { kind: "unavailable" },
    });
  });
});

describe("cliente simulado y sobrantes", () => {
  it("no sugiere un cambio vacío si el desayuno siguiente ya aprovecha el sobrante", async () => {
    const context = makeContext({
      mode: "review-notes",
      notes: [{ day: 2, meal: "lunch", body: "Sobró arroz" }],
      slots: [{ day: 3, meal: "breakfast", recipeId: "calentado", peopleOverride: null }],
    });
    const outcome = await runAssistant(
      createSimulatedAssistantClient(context, { sleep: async () => undefined }),
      context,
    );
    expect(outcome).toMatchObject({
      ok: true,
      changes: [],
      summary: expect.stringMatching(/no sugieren cambios/),
    });
  });
});
