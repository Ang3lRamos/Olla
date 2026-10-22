import { describe, expect, it } from "vitest";
import type { ShoppingLine } from "./shopping-list";
import { formatShoppingText, reconcilePurchases } from "./shopping-status";

const line = (
  ingredientId: string,
  toBuy: number,
  unit: "g" | "unit" = "g",
  fromPantry = 0,
): ShoppingLine => ({
  ingredientId,
  name: ingredientId,
  category: "grains",
  needed: { amount: toBuy + fromPantry, unit },
  fromPantry,
  toBuy: { amount: toBuy, unit },
});

describe("reconcilePurchases", () => {
  const lines = [line("rice", 750), line("beans", 500), line("onion", 3, "unit"), line("oil", 0, "g", 200)];

  it("marca cada línea según lo comprado y lo que cubre la despensa", () => {
    const items = reconcilePurchases(lines, [
      { ingredientId: "rice", quantity: { amount: 500, unit: "g" } },
      { ingredientId: "onion", quantity: { amount: 3, unit: "unit" } },
    ]);
    expect(items.map((item) => [item.ingredientId, item.status, item.remaining.amount])).toEqual([
      ["rice", "needs-more", 250],
      ["beans", "pending", 500],
      ["onion", "bought", 0],
      ["oil", "in-pantry", 0],
    ]);
  });

  it("si se compró de más, queda comprado sin cantidades negativas", () => {
    const [rice] = reconcilePurchases(
      [line("rice", 500)],
      [{ ingredientId: "rice", quantity: { amount: 1000, unit: "g" } }],
    );
    expect(rice).toMatchObject({ status: "bought", remaining: { amount: 0 } });
  });

  it("no mezcla compras en otra unidad", () => {
    const [onion] = reconcilePurchases(
      [line("onion", 2, "unit")],
      [{ ingredientId: "onion", quantity: { amount: 300, unit: "g" } }],
    );
    expect(onion?.status).toBe("pending");
  });
});

describe("formatShoppingText", () => {
  it("arma una lista legible con lo que falta", () => {
    const text = formatShoppingText("Mercado · Semana del 19 al 25 de octubre", [
      {
        label: "Verduras",
        items: [
          { name: "Cebolla cabezona", quantity: { amount: 4, unit: "unit" } },
          { name: "Papa pastusa", quantity: { amount: 1500, unit: "g" } },
        ],
      },
      { label: "Granos", items: [] },
      { label: "Aseo", items: [{ name: "Detergente", quantity: null }] },
    ]);
    expect(text).toBe(
      [
        "Mercado · Semana del 19 al 25 de octubre",
        "",
        "VERDURAS\n- Cebolla cabezona: 4 unidades\n- Papa pastusa: 1,5 kg",
        "",
        "ASEO\n- Detergente",
      ].join("\n"),
    );
  });

  it("avisa cuando no falta nada", () => {
    expect(formatShoppingText("Mercado", [{ label: "Verduras", items: [] }])).toBe(
      "Mercado\n\nNo falta nada por comprar.",
    );
  });
});
