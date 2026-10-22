"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "./button";
import { cn } from "./cn";

interface NumberStepperProps {
  name: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  /** Texto junto al número, en singular y plural: ["persona", "personas"]. */
  unit: [string, string];
  error?: string;
  /** Avisa cada cambio, para quien necesita el valor en vivo (p. ej. escalar porciones). */
  onValueChange?: (value: number) => void;
}

export function NumberStepper({
  name,
  label,
  defaultValue,
  min,
  max,
  unit,
  error,
  onValueChange,
}: NumberStepperProps) {
  const [value, setValue] = useState(defaultValue);
  const labelId = useId();
  const change = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    setValue(next);
    onValueChange?.(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className={cn(
          "flex h-10 w-fit items-center rounded-md border border-hairline-strong bg-surface",
          error && "border-danger",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          className="h-full rounded-r-none px-3"
          aria-label={`Una ${unit[0]} menos`}
          disabled={value <= min}
          onClick={() => change(-1)}
        >
          <Minus className="size-4" />
        </Button>
        <output aria-live="polite" className="min-w-28 px-2 text-center text-[15px] tabular-nums">
          {value} {value === 1 ? unit[0] : unit[1]}
        </output>
        <Button
          type="button"
          variant="ghost"
          className="h-full rounded-l-none px-3"
          aria-label={`Una ${unit[0]} más`}
          disabled={value >= max}
          onClick={() => change(1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <input type="hidden" name={name} value={value} />
      {error && <p className="animate-rise text-sm text-danger">{error}</p>}
    </div>
  );
}
