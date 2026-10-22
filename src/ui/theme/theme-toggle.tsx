"use client";

import { useSyncExternalStore } from "react";
import { cn } from "../cn";
import { THEME_PREFERENCES, THEME_STORAGE_KEY, type ThemePreference } from "./theme";

const CHANGE_EVENT = "olla-theme-change";

const LABELS: Record<ThemePreference, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Oscuro",
};

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_PREFERENCES.find((preference) => preference === stored) ?? "system";
  } catch {
    return "system";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function savePreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Sin almacenamiento (p. ej. modo privado) el tema se aplica solo a esta visita.
    if (preference !== "system") document.documentElement.dataset.theme = preference;
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  const current = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={cn("inline-flex rounded-md border border-hairline bg-sunken p-0.5", className)}
    >
      {THEME_PREFERENCES.map((preference) => (
        <button
          key={preference}
          role="radio"
          aria-checked={current === preference}
          onClick={() => savePreference(preference)}
          className={cn(
            "h-7 rounded-sm px-2.5 text-sm transition-colors duration-(--dur-fast) ease-out",
            current === preference ? "bg-surface text-ink shadow-raised" : "text-muted hover:text-ink",
          )}
        >
          {LABELS[preference]}
        </button>
      ))}
    </div>
  );
}
