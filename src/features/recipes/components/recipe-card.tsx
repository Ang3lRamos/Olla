import { Clock } from "lucide-react";
import Link from "next/link";
import { formatCop } from "@/domain/money";
import { RECIPE_CATEGORY_LABELS } from "@/domain/recipe-categories";
import { cn } from "@/ui/cn";
import type { RecipeSummary } from "../types";

const STAGGERED_CARDS = 6;
const STAGGER_MS = 40;

export function RecipeCard({ recipe, index }: { recipe: RecipeSummary; index: number }) {
  return (
    <li
      className="animate-rise"
      style={{ animationDelay: index < STAGGERED_CARDS ? `${index * STAGGER_MS}ms` : undefined }}
    >
      <Link
        href={`/recetas/${recipe.id}`}
        className={cn(
          "flex h-full flex-col gap-3 rounded-md border border-hairline bg-surface p-4",
          "transition-[border-color,transform] duration-(--dur-fast) ease-out",
          "hover:-translate-y-px hover:border-hairline-strong active:translate-y-0 active:scale-[0.99]",
        )}
      >
        <span className="flex items-center justify-between gap-2 text-xs text-muted">
          {RECIPE_CATEGORY_LABELS[recipe.category]}
          {recipe.isOwn && (
            <span className="rounded-full border border-hairline-strong px-2 py-px text-[11px] font-medium text-ink">
              Tuya
            </span>
          )}
        </span>
        <span className="text-base leading-snug font-medium text-pretty">{recipe.name}</span>
        <span className="mt-auto flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1 text-muted tabular-nums">
            {recipe.prepMinutes && (
              <>
                <Clock className="size-3.5" aria-hidden />
                {recipe.prepMinutes} min
              </>
            )}
          </span>
          <span className="tabular-nums">
            <span className="font-medium">
              {recipe.partialCost ? "desde " : ""}
              {formatCop(recipe.costPerServingCop)}
            </span>
            <span className="text-muted"> / porción</span>
          </span>
        </span>
      </Link>
    </li>
  );
}
