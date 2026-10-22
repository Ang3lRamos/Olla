import { describe, expect, it } from "vitest";
import {
  addDays,
  dayIndex,
  formatWeekRange,
  isIsoDate,
  localDate,
  resolveWeekStart,
  startOfWeek,
  weekDates,
  weekdayLabels,
} from "./week";

describe("localDate", () => {
  it("usa la fecha de Bogotá, no la UTC del servidor", () => {
    // Domingo 25 a las 8 p. m. en Bogotá ya es lunes 26 en UTC.
    expect(localDate(new Date("2026-10-26T01:00:00Z"))).toBe("2026-10-25");
    expect(localDate(new Date("2026-10-26T06:00:00Z"))).toBe("2026-10-26");
  });
});

describe("startOfWeek", () => {
  it.each([
    ["2026-10-19", "2026-10-19"],
    ["2026-10-21", "2026-10-19"],
    ["2026-10-25", "2026-10-19"],
    ["2026-11-01", "2026-10-26"],
    ["2027-01-01", "2026-12-28"],
  ])("%s -> lunes %s", (date, monday) => {
    expect(startOfWeek(date)).toBe(monday);
  });
});

describe("addDays y weekDates", () => {
  it("cruza meses y años", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("devuelve los 7 días desde el lunes", () => {
    expect(weekDates("2026-10-26")).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });
});

describe("dayIndex", () => {
  it("ubica la fecha en la semana o devuelve null si está fuera", () => {
    expect(dayIndex("2026-10-19", "2026-10-19")).toBe(0);
    expect(dayIndex("2026-10-19", "2026-10-25")).toBe(6);
    expect(dayIndex("2026-10-19", "2026-10-26")).toBeNull();
    expect(dayIndex("2026-10-19", "2026-10-18")).toBeNull();
  });
});

describe("resolveWeekStart", () => {
  const today = "2026-10-22";

  it("acepta un lunes válido", () => {
    expect(resolveWeekStart("2026-11-02", today)).toBe("2026-11-02");
  });

  it.each([undefined, "", "2026-10-21", "2026-02-30", "mañana"])("con %j usa la semana actual", (param) => {
    expect(resolveWeekStart(param, today)).toBe("2026-10-19");
  });
});

describe("isIsoDate", () => {
  it("rechaza fechas imposibles", () => {
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
  });
});

describe("formato", () => {
  it("describe el rango de la semana en español", () => {
    expect(formatWeekRange("2026-10-19")).toBe("Semana del 19 al 25 de octubre");
    expect(formatWeekRange("2026-10-26")).toBe("Semana del 26 de octubre al 1 de noviembre");
  });

  it("nombra los días", () => {
    expect(weekdayLabels("2026-10-21")).toEqual({ short: "Mié", long: "Miércoles", dayOfMonth: 21 });
    expect(weekdayLabels("2026-10-25")).toEqual({ short: "Dom", long: "Domingo", dayOfMonth: 25 });
  });
});
