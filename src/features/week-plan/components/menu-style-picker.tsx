import Link from "next/link";
import { MENU_STYLE_LABELS, MENU_STYLES, NUTRITION_STYLES, type MenuStyle } from "@/domain/menu-styles";
import { cn } from "@/ui/cn";

interface MenuStylePickerProps {
  value: MenuStyle | null;
  onChange: (style: MenuStyle | null) => void;
  /** Sin nutrición en el plan, los estilos que la usan quedan bloqueados. */
  nutritionLocked: boolean;
}

const chipClass =
  "rounded-full border px-3 py-1 text-sm transition-colors duration-(--dur-fast) ease-out disabled:cursor-not-allowed disabled:opacity-50";

/** Un estilo opcional para orientar la semana; solo cambia el orden de las recetas. */
export function MenuStylePicker({ value, onChange, nutritionLocked }: MenuStylePickerProps) {
  const options: Array<MenuStyle | null> = [null, ...MENU_STYLES];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Estilo de la semana</p>
      <div role="radiogroup" aria-label="Estilo de la semana" className="flex flex-wrap gap-1.5">
        {options.map((style) => {
          const checked = value === style;
          const locked = style !== null && nutritionLocked && NUTRITION_STYLES.has(style);
          return (
            <button
              key={style ?? "none"}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={locked}
              onClick={() => onChange(style)}
              className={cn(
                chipClass,
                checked
                  ? "border-accent bg-accent text-on-accent"
                  : "border-hairline-strong hover:border-muted",
              )}
            >
              {style ? MENU_STYLE_LABELS[style] : "Sin estilo"}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        Ordena las recetas con estimaciones aproximadas; no es una dieta ni una recomendación.
        {nutritionLocked && (
          <>
            {" "}
            Proteína y porciones ligeras son de los{" "}
            <Link href="/planes" className="underline decoration-hairline-strong underline-offset-4">
              planes
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}
