import { describe, expect, it } from "vitest";
import { addBusinessDays, colombianHolidays } from "./business-days";

describe("colombianHolidays", () => {
  it("incluye fijos, trasladados al lunes y los de Semana Santa", () => {
    const holidays = colombianHolidays(2026);
    expect(holidays.size).toBe(18);
    // Fijo, Reyes (6 ene, martes → lunes 12), Jueves y Viernes Santo, Corpus y la Raza.
    for (const day of ["2026-01-01", "2026-01-12", "2026-04-02", "2026-04-03", "2026-06-08", "2026-10-12"]) {
      expect(holidays.has(day)).toBe(true);
    }
    expect(holidays.has("2026-01-06")).toBe(false);
  });
});

describe("addBusinessDays", () => {
  it("salta fines de semana", () => {
    // Pago un lunes: el plazo de 5 días hábiles vence el lunes siguiente.
    expect(addBusinessDays("2026-10-19", 5)).toBe("2026-10-26");
  });

  it("salta festivos", () => {
    // Viernes 27 de marzo de 2026: Semana Santa alarga el plazo hasta el martes 7 de abril.
    expect(addBusinessDays("2026-03-27", 5)).toBe("2026-04-07");
  });
});
