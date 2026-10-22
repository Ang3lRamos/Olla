export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const THEME_STORAGE_KEY = "olla-theme";

/**
 * Se ejecuta en <head> antes de pintar para evitar el destello de tema incorrecto.
 * Resuelve "system" con prefers-color-scheme y sigue los cambios del sistema.
 */
export const THEME_INIT_SCRIPT = `(() => {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const stored = () => { try { return localStorage.getItem("${THEME_STORAGE_KEY}"); } catch { return null; } };
  const apply = () => {
    const pref = stored();
    document.documentElement.dataset.theme = pref === "light" || pref === "dark" ? pref : media.matches ? "dark" : "light";
  };
  apply();
  media.addEventListener("change", apply);
  window.addEventListener("olla-theme-change", apply);
})();`;
