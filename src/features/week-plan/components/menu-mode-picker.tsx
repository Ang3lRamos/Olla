import { cn } from "@/ui/cn";

export type MenuMode = "mine" | "mixed" | "suggest";

const MODES: Array<{ value: MenuMode; label: string; hint: string; usesAssistant: boolean }> = [
  {
    value: "mine",
    label: "Solo con lo mío",
    hint: "Recetas con lo que tienes en casa y lo que vas a mercar. Al instante y sin gastar consultas.",
    usesAssistant: false,
  },
  {
    value: "mixed",
    label: "Mixto",
    hint: "El asistente usa primero tu lista y completa con tus preferencias.",
    usesAssistant: true,
  },
  {
    value: "suggest",
    label: "Que el asistente proponga",
    hint: "Con tus preferencias y tu presupuesto. También ajusta la semana o revisa tus notas.",
    usesAssistant: true,
  },
];

interface MenuModePickerProps {
  value: MenuMode;
  onChange: (mode: MenuMode) => void;
  /** Sin asistente en el plan, sus opciones lo indican. */
  assistantLocked: boolean;
}

export function MenuModePicker({ value, onChange, assistantLocked }: MenuModePickerProps) {
  return (
    <div role="radiogroup" aria-label="Cómo armar el menú" className="flex flex-col gap-2">
      {MODES.map((mode) => {
        const checked = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(mode.value)}
            className={cn(
              "flex items-start gap-3 rounded-md border px-3 py-2.5 text-left",
              "transition-[border-color,box-shadow] duration-(--dur-fast) ease-out",
              checked ? "border-accent shadow-raised" : "border-hairline hover:border-muted",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "mt-1 grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-(--dur-fast) ease-out",
                checked ? "border-accent" : "border-hairline-strong",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full bg-accent transition-transform duration-(--dur-fast) ease-out",
                  checked ? "scale-100" : "scale-0",
                )}
              />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2 text-[15px] font-medium">
                {mode.label}
                {mode.usesAssistant && assistantLocked && (
                  <span className="rounded-full border border-hairline-strong px-1.5 text-[11px] font-semibold">
                    Planes
                  </span>
                )}
              </span>
              <span className="text-sm text-muted">{mode.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
