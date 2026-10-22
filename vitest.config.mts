import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "supabase/**/*.test.ts"],
    environment: "node",
    // Levantar Postgres en memoria (PGlite) con todas las migraciones tarda más cuando las
    // pruebas corren en paralelo.
    hookTimeout: 60_000,
  },
});
