"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "../cn";
import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, THEMES, type Theme } from "./theme";

const OPTIONS: Record<Theme, { label: string; Icon: typeof Sun }> = {
  light: { label: "Claro", Icon: Sun },
  dark: { label: "Oscuro", Icon: Moon },
};

const readTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** Observa data-theme, que lo fijan el script de <head> (sistema) o este control. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  } catch {
    // Sin almacenamiento (p. ej. modo privado) el tema se aplica solo a esta visita.
    document.documentElement.dataset.theme = theme;
  }
}

/** Funde la vista completa con View Transitions; sin soporte o con movimiento reducido, cambia directo. */
function switchTheme(theme: Theme) {
  const root = document.documentElement;
  const update = () => {
    root.setAttribute("data-theme-switching", "");
    saveTheme(theme);
  };
  const cleanUp = () => requestAnimationFrame(() => root.removeAttribute("data-theme-switching"));

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reducedMotion) {
    update();
    cleanUp();
    return;
  }
  document.startViewTransition(update).finished.finally(cleanUp);
}

export function ThemeToggle({ className }: { className?: string }) {
  const current = useSyncExternalStore(subscribe, readTheme, () => null);

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={cn(
        "relative inline-grid grid-cols-2 rounded-md border border-hairline bg-sunken p-0.5",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-sm bg-surface shadow-raised",
          "transition-[transform,opacity] duration-(--dur-base) ease-out",
          current === null && "opacity-0",
          current === "dark" && "translate-x-full",
        )}
      />
      {THEMES.map((theme) => {
        const { label, Icon } = OPTIONS[theme];
        return (
          <button
            key={theme}
            type="button"
            role="radio"
            aria-checked={current === theme}
            onClick={() => current !== theme && switchTheme(theme)}
            className={cn(
              "relative flex h-7 items-center justify-center gap-1.5 rounded-sm px-3 text-sm",
              "transition-colors duration-(--dur-fast) ease-out",
              current === theme ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
