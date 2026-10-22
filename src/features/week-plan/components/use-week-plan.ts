"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { Meal } from "@/domain/week";
import type { PlannedSlot } from "@/domain/week-plan";
import { assignMeal, clearMeal, setWeekPeople, type WeekActionResult } from "../actions";

interface WeekState {
  slots: PlannedSlot[];
  people: number;
}

type WeekChange =
  | { type: "assign"; slot: PlannedSlot }
  | { type: "clear"; day: number; meal: Meal }
  | { type: "people"; people: number };

const sameSlot = (slot: PlannedSlot, day: number, meal: Meal) => slot.day === day && slot.meal === meal;

function applyChange(state: WeekState, change: WeekChange): WeekState {
  switch (change.type) {
    case "assign":
      return {
        ...state,
        slots: [
          ...state.slots.filter((slot) => !sameSlot(slot, change.slot.day, change.slot.meal)),
          change.slot,
        ],
      };
    case "clear":
      return { ...state, slots: state.slots.filter((slot) => !sameSlot(slot, change.day, change.meal)) };
    case "people":
      return { ...state, people: change.people };
  }
}

/**
 * Estado de la semana con cambios optimistas: la interfaz y los costos responden al instante
 * y, si el servidor falla, vuelven solos al estado guardado y queda un mensaje.
 */
export function useWeekPlan(weekStart: string, saved: WeekState) {
  const [state, applyOptimistic] = useOptimistic(saved, applyChange);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (change: WeekChange, save: () => Promise<WeekActionResult>) =>
    startTransition(async () => {
      applyOptimistic(change);
      const result = await save();
      setError(result.ok ? undefined : result.error);
    });

  return {
    ...state,
    pending,
    error,
    dismissError: () => setError(undefined),
    assign: (slot: PlannedSlot) => run({ type: "assign", slot }, () => assignMeal({ weekStart, ...slot })),
    clear: (day: number, meal: Meal) =>
      run({ type: "clear", day, meal }, () => clearMeal({ weekStart, day, meal })),
    setPeople: (people: number) =>
      run({ type: "people", people }, () => setWeekPeople({ weekStart, people })),
  };
}
