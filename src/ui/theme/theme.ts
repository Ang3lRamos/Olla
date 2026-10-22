export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "olla-theme";
export const THEME_CHANGE_EVENT = "olla-theme-change";

/**
 * Se ejecuta en <head> antes de pintar para evitar el destello de tema incorrecto.
 * Usa el tema elegido por el usuario; si aún no eligió, el del sistema.
 */
export const THEME_INIT_SCRIPT = `(() => {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    let stored = null;
    try { stored = localStorage.getItem("${THEME_STORAGE_KEY}"); } catch {}
    document.documentElement.dataset.theme = stored === "light" || stored === "dark" ? stored : media.matches ? "dark" : "light";
  };
  apply();
  media.addEventListener("change", apply);
  window.addEventListener("${THEME_CHANGE_EVENT}", apply);
})();`;
