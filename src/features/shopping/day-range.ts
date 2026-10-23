import type { DayRange } from "./shopping-view";

/** "?dias=0-2" ↔ { from: 0, to: 2 }; cualquier otra cosa es toda la semana. */
export function parseDayRange(raw: string | string[] | undefined): DayRange | undefined {
  const match = typeof raw === "string" ? /^([0-6])-([0-6])$/.exec(raw) : null;
  if (!match) return undefined;
  const from = Number(match[1]);
  const to = Number(match[2]);
  return from <= to && !(from === 0 && to === 6) ? { from, to } : undefined;
}

export const formatDayRange = (range: DayRange) => `${range.from}-${range.to}`;
