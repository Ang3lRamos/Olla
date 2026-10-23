-- Aporte nutricional aproximado de cada ingrediente, para estimar (no es consejo nutricional).
-- {"basis": "100g" | "100ml" | "unit", "kcal", "protein", "carbs", "sugar", "fat", "fiber"}.
-- Los del catálogo vienen de la semilla; los productos del hogar pueden no tenerlo.
alter table public.ingredients
  add column nutrients jsonb check (
    nutrients is null
    or (jsonb_typeof(nutrients) = 'object' and nutrients->>'basis' in ('100g', '100ml', 'unit'))
  );
