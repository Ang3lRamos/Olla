import { Checkbox } from "@/ui/checkbox";
import type { RecipeMatch } from "../cook-with";

const SHOWN = 15;

interface StockRecipesProps {
  matches: RecipeMatch[];
  picked: Set<string>;
  onToggle: (recipeId: string) => void;
}

/** Las recetas que aprovechan lo elegido; vienen marcadas las que no piden casi nada aparte. */
export function StockRecipes({ matches, picked, onToggle }: StockRecipesProps) {
  if (matches.length === 0) {
    return (
      <p className="rounded-md bg-sunken px-3 py-2.5 text-sm text-muted">
        Ninguna receta usa eso todavía. Agrega otro ingrediente o crea tu propia receta.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">
        Marcamos las que no te piden comprar nada más, o casi nada. Olla no gasta más de lo que tienes en
        casa.
      </p>
      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {matches.slice(0, SHOWN).map((match) => (
          <li key={match.recipeId} className="py-2.5">
            <Checkbox
              checked={picked.has(match.recipeId)}
              onChange={() => onToggle(match.recipeId)}
              label={
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{match.name}</span>
                  <span className="text-xs text-cilantro">Usa {match.uses.join(", ")}</span>
                  {match.missing.length > 0 && (
                    <span className="text-xs text-muted">Hay que comprar {match.missing.join(", ")}</span>
                  )}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
