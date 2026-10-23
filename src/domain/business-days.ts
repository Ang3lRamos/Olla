/** Fechas "aaaa-mm-dd": los festivos y los días hábiles se cuentan en el calendario de Colombia. */
type Day = string;

/** El día en hora de Colombia, para que la medianoche UTC no parta el día. */
export const bogotaDay = (date: Date): Day =>
  date.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

const iso = (date: Date): Day => date.toISOString().slice(0, 10);
const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day));
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

/** Domingo de Pascua (algoritmo gregoriano anónimo). */
function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month, day);
}

/** Ley Emiliani (Ley 51 de 1983): el festivo que no cae en lunes se pasa al lunes siguiente. */
const toMonday = (date: Date) => addDays(date, (8 - date.getUTCDay()) % 7);

/** Festivos de Colombia en un año. */
export function colombianHolidays(year: number): Set<Day> {
  const fixed = [
    [1, 1],
    [5, 1],
    [7, 20],
    [8, 7],
    [12, 8],
    [12, 25],
  ].map(([month, day]) => utc(year, month!, day!));
  const moved = [
    [1, 6],
    [3, 19],
    [6, 29],
    [8, 15],
    [10, 12],
    [11, 1],
    [11, 11],
  ].map(([month, day]) => toMonday(utc(year, month!, day!)));
  const sunday = easter(year);
  const fromEaster = [addDays(sunday, -3), addDays(sunday, -2)];
  const movedFromEaster = [39, 60, 68].map((offset) => toMonday(addDays(sunday, offset)));
  return new Set([...fixed, ...moved, ...fromEaster, ...movedFromEaster].map(iso));
}

const isBusinessDay = (date: Date) =>
  date.getUTCDay() !== 0 &&
  date.getUTCDay() !== 6 &&
  !colombianHolidays(date.getUTCFullYear()).has(iso(date));

/** El último día de un plazo de `count` días hábiles que empieza a contar el día después de `start`. */
export function addBusinessDays(start: Day, count: number): Day {
  let date = new Date(`${start}T00:00:00Z`);
  let left = count;
  while (left > 0) {
    date = addDays(date, 1);
    if (isBusinessDay(date)) left--;
  }
  return iso(date);
}
