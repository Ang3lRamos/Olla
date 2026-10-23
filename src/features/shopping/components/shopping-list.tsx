"use client";

import type { DetailLevel } from "@/domain/detail-level";
import { X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { buildCatalog } from "@/domain/catalog";
import { formatCop } from "@/domain/money";
import type { Purchase } from "@/domain/shopping-status";
import { formatShoppingText } from "@/domain/shopping-status";
import type { Ingredient, IngredientPrice, PantryItem, Recipe } from "@/domain/types";
import type { IsoDate } from "@/domain/week";
import { formatWeekRange } from "@/domain/week";
import type { PlannedSlot } from "@/domain/week-plan";
import { toIngredientBase } from "@/domain/units";
import { Button, buttonClasses } from "@/ui/button";
import type { ShoppingExtra } from "../data";
import { formatDayRange } from "../day-range";
import { buildShoppingView, type DayRange } from "../shopping-view";
import { DayRangePicker } from "./day-range-picker";
import { AddExtraForm, ExtraRow } from "./extra-items";
import { ShoppingLine } from "./shopping-line";
import { InPantryList, ShoppingProgress } from "./shopping-progress";
import { useShopping } from "./use-shopping";

export interface ShoppingListProps {
  weekStart: IsoDate;
  people: number;
  slots: PlannedSlot[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  prices: IngredientPrice[];
  pantry: PantryItem[];
  purchases: Purchase[];
  extras: ShoppingExtra[];
  detail: DetailLevel;
  /** Tramo de días que viene en la URL (?dias=0-2). */
  initialDays?: DayRange;
}

export function ShoppingList(props: ShoppingListProps) {
  const { weekStart, people, slots, pantry } = props;
  const shopping = useShopping(weekStart, { purchases: props.purchases, extras: props.extras });
  const [days, setDays] = useState(props.initialDays);
  // El tramo queda en la URL: al recargar o compartir el enlace se ve el mismo mercado.
  const changeDays = (range: DayRange | undefined) => {
    setDays(range);
    const url = new URL(window.location.href);
    if (range) url.searchParams.set("dias", formatDayRange(range));
    else url.searchParams.delete("dias");
    window.history.replaceState(null, "", url);
  };
  const catalog = useMemo(() => buildCatalog(props.ingredients), [props.ingredients]);
  const prices = useMemo(
    () => new Map(props.prices.map((price) => [price.ingredientId, price])),
    [props.prices],
  );
  const recipes = useMemo(() => new Map(props.recipes.map((recipe) => [recipe.id, recipe])), [props.recipes]);

  const view = buildShoppingView({
    slots,
    recipes,
    people,
    pantry,
    purchases: shopping.purchases,
    extras: shopping.extras,
    catalog,
    prices,
    detail: props.detail,
    days,
  });
  const { totals } = view;

  const listText = () =>
    formatShoppingText(
      `Mercado · ${formatWeekRange(weekStart)}`,
      view.groups.map((group) => ({
        label: group.label,
        items: [
          ...group.items
            .filter(({ item }) => item.status !== "bought")
            .map(({ item, amountLabel }) => ({
              name: item.name,
              quantity: item.remaining,
              detail: amountLabel,
            })),
          ...group.extras
            .filter((extra) => !extra.checked)
            .map((extra) => ({ name: extra.name, quantity: null })),
        ],
      })),
    );

  // Sin comidas en toda la semana no hay mercado; un tramo de días vacío sí se muestra (con su selector).
  if (slots.length === 0 && shopping.extras.length === 0) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-3 rounded-md border border-dashed border-hairline-strong p-6">
        <p className="font-medium">Esta semana aún no tiene comidas.</p>
        <p className="text-sm text-muted">El mercado se arma solo con las recetas que pongas en la semana.</p>
        <Link href={`/semana?semana=${weekStart}`} className={buttonClasses({ size: "sm" })}>
          Planear la semana
        </Link>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-8">
      {/* En celular el avance va primero (es lo que se mira mientras se compra); en escritorio, a la derecha. */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1">
        <ShoppingProgress totals={totals} getListText={listText} />
        <DayRangePicker weekStart={weekStart} value={days} onChange={changeDays} />
      </div>

      <section
        aria-label="Lista de mercado"
        className="rounded-sm bg-surface px-5 pt-5 pb-6 shadow-raised lg:col-start-1 lg:row-span-2 lg:row-start-1"
      >
        <header className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
          <h2 className="letrero text-2xl">Mercado</h2>
          <p className="text-xs text-muted">
            {view.plannedMeals} comidas · {people} personas
          </p>
        </header>

        {shopping.error && (
          <div
            role="alert"
            className="mt-3 flex items-center justify-between gap-3 rounded-md border border-danger/30 px-3 py-2 text-sm"
          >
            <span>{shopping.error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              aria-label="Cerrar aviso"
              onClick={shopping.dismissError}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {view.groups.length === 0 && (
          <p className="py-6 text-sm text-muted">
            {days ? "Para esos días no hay nada por comprar." : "No hay nada por comprar."}
          </p>
        )}
        {view.groups.map((group) => (
          <div
            key={group.category}
            className="border-b border-dashed border-hairline-strong py-3 last:border-b-0"
          >
            <h3 className="mb-1 letrero text-xs text-muted">{group.label}</h3>
            <ul>
              {group.items.map((priced) => (
                <ShoppingLine
                  key={`${priced.item.ingredientId}-${priced.item.toBuy.unit}`}
                  priced={priced}
                  onToggle={(checked) =>
                    checked
                      ? shopping.purchase({
                          ingredientId: priced.item.ingredientId,
                          quantity: priced.markAsBought,
                        })
                      : shopping.unpurchase(priced.item.ingredientId, priced.item.toBuy.unit)
                  }
                  onPartial={(quantity) => {
                    const bought = toIngredientBase(quantity, priced.ingredient);
                    shopping.purchase({
                      ingredientId: priced.item.ingredientId,
                      quantity: { amount: priced.item.purchased + bought.amount, unit: bought.unit },
                    });
                  }}
                />
              ))}
              {group.extras.map((extra) => (
                <ExtraRow
                  key={extra.id}
                  extra={extra}
                  onCheck={(checked) => shopping.checkExtra(extra.id, checked)}
                  onRemove={() => shopping.removeExtra(extra.id)}
                />
              ))}
            </ul>
          </div>
        ))}

        <footer className="flex items-baseline justify-between border-t-2 border-ink pt-4">
          <span className="text-sm text-muted">Total estimado</span>
          <span className="letrero text-3xl tabular-nums">{formatCop(totals.marketCop)}</span>
        </footer>
        {totals.unpricedCount > 0 && (
          <p className="mt-1 text-right text-xs text-muted">
            {totals.unpricedCount} sin precio ·{" "}
            <Link
              href="/presupuesto"
              className="underline decoration-hairline-strong underline-offset-4 hover:text-ink"
            >
              agrégalos en Presupuesto
            </Link>
          </p>
        )}
      </section>

      <aside className="flex flex-col gap-6 lg:col-start-2 lg:row-start-2">
        <AddExtraForm onAdd={shopping.addExtra} />

        <InPantryList items={view.inPantry} />
      </aside>
    </div>
  );
}
