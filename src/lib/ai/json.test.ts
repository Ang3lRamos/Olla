import { describe, expect, it } from "vitest";
import { extractJson } from "./json";

describe("extractJson", () => {
  it("lee un objeto limpio", () => {
    expect(extractJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it("tolera bloques de código y texto alrededor", () => {
    expect(extractJson('Claro, aquí está:\n```json\n{"a": [1, 2]}\n```\nEspero que sirva.')).toEqual({
      a: [1, 2],
    });
  });

  it("no se confunde con llaves dentro de textos", () => {
    expect(extractJson('{"nota": "usa {sobrantes} y \\"arroz\\"", "b": {"c": true}} y algo más')).toEqual({
      nota: 'usa {sobrantes} y "arroz"',
      b: { c: true },
    });
  });

  it("falla con claridad si no hay JSON o está cortado", () => {
    expect(() => extractJson("No puedo ayudar con eso.")).toThrow("no contiene un objeto JSON");
    expect(() => extractJson('{"a": [1, 2')).toThrow("incompleto");
  });

  it("no repara JSON inválido", () => {
    expect(() => extractJson("{a: 1}")).toThrow(SyntaxError);
  });
});
