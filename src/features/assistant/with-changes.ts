import type { PlannedSlot } from "@/domain/week-plan";
import type { ProposedChange } from "./sanitize";

/** Cómo quedaría la semana con los cambios elegidos; conserva las personas propias de cada comida. */
export function withChanges(slots: PlannedSlot[], changes: ProposedChange[]): PlannedSlot[] {
  const sameSlot = (slot: PlannedSlot, change: ProposedChange) =>
    slot.day === change.day && slot.meal === change.meal;
  const untouched = slots.filter((slot) => !changes.some((change) => sameSlot(slot, change)));
  const added = changes.flatMap((change) =>
    change.recipeId
      ? [
          {
            day: change.day,
            meal: change.meal,
            recipeId: change.recipeId,
            peopleOverride: slots.find((slot) => sameSlot(slot, change))?.peopleOverride ?? null,
          },
        ]
      : [],
  );
  return [...untouched, ...added];
}
