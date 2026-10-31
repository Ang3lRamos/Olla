import { describe, expect, it } from "vitest";
import { shortages, stockAfter, withdraw } from "./stock";
import { arrozBlanco, catalog } from "./test-fixtures";

const everything = () => true;

describe("stockAfter", () => {
  it("descuenta lo que piden las comidas ya planeadas, en la unidad base", () => {
    const stock = stockAfter(
      [{ ingredientId: "rice", quantity: { amount: 2, unit: "lb" } }],
      [{ day: 0, recipe: arrozBlanco, servings: 4 }],
      catalog,
    );
    expect(stock.get("rice|g")).toBe(500);
  });

  it("no baja de cero", () => {
    const stock = stockAfter(
      [{ ingredientId: "rice", quantity: { amount: 200, unit: "g" } }],
      [{ day: 0, recipe: arrozBlanco, servings: 4 }],
      catalog,
    );
    expect(stock.get("rice|g")).toBe(0);
  });
});

describe("shortages", () => {
  const stock = stockAfter([{ ingredientId: "rice", quantity: { amount: 750, unit: "g" } }], [], catalog);

  it("avisa cuando lo que hay en casa no alcanza para esas porciones", () => {
    expect(shortages(stock, arrozBlanco, 4, catalog, everything)).toEqual([]);
    expect(shortages(stock, arrozBlanco, 8, catalog, everything)).toEqual(["rice"]);
  });

  it("no limita lo que no está en la despensa ni lo que se pide ignorar", () => {
    expect(shortages(stock, arrozBlanco, 8, catalog, (id) => id !== "rice")).toEqual([]);
  });

  it("alcanza para una sola vez si la primera se lo lleva", () => {
    const after = withdraw(stock, arrozBlanco, 4, catalog);
    expect(shortages(after, arrozBlanco, 4, catalog, everything)).toEqual(["rice"]);
  });
});
