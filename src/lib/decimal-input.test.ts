import { describe, expect, it } from "vitest";
import { formatDecimalInput, parseDecimal } from "./decimal-input";

describe("parseDecimal", () => {
  it.each([
    ["1,5", 1.5],
    ["2.25", 2.25],
    [" 3 ", 3],
    [4, 4],
    ["", Number.NaN],
    ["abc", Number.NaN],
  ])("%j -> %d", (raw, expected) => {
    expect(parseDecimal(raw)).toBe(expected);
  });
});

describe("formatDecimalInput", () => {
  it("usa coma decimal", () => {
    expect(formatDecimalInput(1.5)).toBe("1,5");
    expect(formatDecimalInput(3)).toBe("3");
  });
});
