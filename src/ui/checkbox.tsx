import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label: ReactNode;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("group flex cursor-pointer items-center gap-3", className)}>
      <span className="relative grid size-5 shrink-0 place-items-center">
        <input
          type="checkbox"
          className={cn(
            "peer size-5 cursor-pointer appearance-none rounded-sm border-[1.5px] border-hairline-strong bg-surface",
            "transition-colors duration-(--dur-fast) ease-out checked:border-cilantro checked:bg-cilantro",
          )}
          {...props}
        />
        <svg
          viewBox="0 0 16 16"
          aria-hidden
          className={cn(
            "pointer-events-none absolute size-3.5 scale-75 text-white opacity-0",
            "transition-[opacity,transform] duration-(--dur-fast) ease-out peer-checked:scale-100 peer-checked:opacity-100",
          )}
        >
          <path
            d="M3 8.5 6.5 12 13 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="transition-colors duration-(--dur-base) group-has-checked:text-muted group-has-checked:line-through">
        {label}
      </span>
    </label>
  );
}
