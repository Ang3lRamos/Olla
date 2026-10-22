"use client";

import { useActionState } from "react";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { NumberStepper } from "@/ui/number-stepper";
import { TextField } from "@/ui/text-field";
import type { HouseholdFormState } from "../actions";
import { MAX_PEOPLE } from "../schemas";
import { BudgetField } from "./budget-field";
import { ExclusionsField } from "./exclusions-field";

export interface HouseholdFormDefaults {
  name: string;
  defaultPeople: number;
  weeklyBudgetCop: number | null;
  exclude: string[];
}

interface HouseholdFormProps {
  action: (state: HouseholdFormState, formData: FormData) => Promise<HouseholdFormState>;
  defaults: HouseholdFormDefaults;
  submitLabel: string;
}

export function HouseholdForm({ action, defaults, submitLabel }: HouseholdFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const typed = state.values;
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}

      <TextField
        label="Nombre del hogar"
        name="name"
        autoComplete="off"
        placeholder="Ej.: Casa Ramírez"
        defaultValue={typed?.name ?? defaults.name}
        error={errors?.name}
        required
      />
      <NumberStepper
        name="defaultPeople"
        label="¿Cuántas personas comen normalmente?"
        defaultValue={typed ? Number(typed.defaultPeople) : defaults.defaultPeople}
        min={1}
        max={MAX_PEOPLE}
        unit={["persona", "personas"]}
        error={errors?.defaultPeople}
      />
      <BudgetField
        defaultValue={typed?.weeklyBudgetCop ?? String(defaults.weeklyBudgetCop ?? "")}
        error={errors?.weeklyBudgetCop}
      />
      <ExclusionsField defaultValue={typed?.exclude ?? defaults.exclude.join(", ")} error={errors?.exclude} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        {state.saved && !pending && (
          <FormMessage tone="success" className="border-transparent px-0 py-0">
            Cambios guardados.
          </FormMessage>
        )}
      </div>
    </form>
  );
}
