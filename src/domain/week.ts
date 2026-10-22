/**
 * Fechas como texto ISO ("2026-10-19"), sin horas: así un día nunca cambia por la zona
 * horaria del servidor. La semana va de lunes (día 0) a domingo (día 6).
 */
export type IsoDate = string;

export const MEALS = ["breakfast", "lunch", "dinner"] as const;
export type Meal = (typeof MEALS)[number];

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Comida",
};

export const HOUSEHOLD_TIME_ZONE = "America/Bogota";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const toUtcDate = (iso: IsoDate) => new Date(`${iso}T00:00:00Z`);
const toIso = (date: Date): IsoDate => date.toISOString().slice(0, 10);

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value) && toIso(toUtcDate(value)) === value;
}

/** Fecha del calendario en la zona horaria del hogar para un instante dado. */
export function localDate(instant: Date, timeZone = HOUSEHOLD_TIME_ZONE): IsoDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = toUtcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** Lunes de la semana que contiene la fecha. */
export function startOfWeek(iso: IsoDate): IsoDate {
  const mondayBased = (toUtcDate(iso).getUTCDay() + 6) % 7;
  return addDays(iso, -mondayBased);
}

export function weekDates(weekStart: IsoDate): IsoDate[] {
  return Array.from({ length: 7 }, (_, day) => addDays(weekStart, day));
}

/** Día 0-6 dentro de la semana, o null si la fecha cae fuera de ella. */
export function dayIndex(weekStart: IsoDate, iso: IsoDate): number | null {
  const diff = Math.round((toUtcDate(iso).getTime() - toUtcDate(weekStart).getTime()) / 86_400_000);
  return diff >= 0 && diff < 7 ? diff : null;
}

/** Acepta solo un lunes válido; cualquier otra cosa vuelve a la semana actual. */
export function resolveWeekStart(param: string | undefined, today: IsoDate): IsoDate {
  if (param && isIsoDate(param) && startOfWeek(param) === param) return param;
  return startOfWeek(today);
}

const DAY_MONTH = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", timeZone: "UTC" });
const DAY_ONLY = new Intl.DateTimeFormat("es-CO", { day: "numeric", timeZone: "UTC" });
const SHORT_WEEKDAY = new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: "UTC" });
const LONG_WEEKDAY = new Intl.DateTimeFormat("es-CO", { weekday: "long", timeZone: "UTC" });

/** "Semana del 19 al 25 de octubre" o, si cruza de mes, "del 27 de octubre al 2 de noviembre". */
export function formatWeekRange(weekStart: IsoDate): string {
  const start = toUtcDate(weekStart);
  const end = toUtcDate(addDays(weekStart, 6));
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return `Semana del ${sameMonth ? DAY_ONLY.format(start) : DAY_MONTH.format(start)} al ${DAY_MONTH.format(end)}`;
}

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase("es") + text.slice(1);

export function weekdayLabels(iso: IsoDate) {
  const date = toUtcDate(iso);
  return {
    short: capitalize(SHORT_WEEKDAY.format(date).replace(".", "")),
    long: capitalize(LONG_WEEKDAY.format(date)),
    dayOfMonth: date.getUTCDate(),
  };
}
