@AGENTS.md

# Olla

Aplicación web de planeación de comidas para hogares en Colombia: recetas, despensa, menú semanal, lista de mercado, presupuesto en COP, notas y un asistente de IA que propone menús. Proyecto de portafolio con calidad de producto, preparado para convertirse en SaaS por suscripción (el hogar es la unidad de cobro). En producción en Vercel.

Fuera de alcance: calorías, metas de peso, consejo médico o nutricional, pagos, despliegue y app nativa.

## Skills obligatorias
Aplica siempre estas skills al escribir, revisar o diseñar cualquier parte del proyecto:
- `codigo-limpio`: cambios mínimos, nombres del dominio, sin código muerto ni comentarios del "qué".
- `estructura-modular`: archivos de 300–400 líneas como máximo, componentes de ~200, una responsabilidad por archivo.
- `diseno-con-referencias`: todo diseño parte de referencias reales y de los tokens; nada de estética genérica de IA.
- `transiciones-ui`: movimiento sutil con los tokens de duración y curva, y respeto por `prefers-reduced-motion`.

## Stack
- Next.js 16 (App Router, Server Components, Server Actions) con TypeScript estricto (`noUncheckedIndexedAccess`). Esta versión trae cambios respecto a versiones anteriores: consulta `node_modules/next/dist/docs/` antes de usar una API.
- Tailwind CSS v4. Los tokens de diseño viven en un solo lugar: `src/styles/tokens.css`.
- Supabase (Postgres, Auth y RLS) con `@supabase/ssr`. Desarrollo contra un proyecto de Supabase Cloud gratuito.
- zod v4 para validar todo lo que entra: formularios, Server Actions y respuestas de la IA.
- Vitest para las pruebas.

## Arquitectura
Cada capa depende solo de la siguiente:
1. `src/app/`: rutas y composición de pantallas, sin reglas de negocio.
2. `src/features/<funcionalidad>/`: `components/`, `actions.ts` (Server Actions: validan, orquestan y revalidan), `data.ts` (consultas a Supabase que solo mapean filas a tipos del dominio) y `schemas.ts`.
3. `src/domain/`: funciones puras sin I/O para unidades, escalado, consolidación del mercado, resta de la despensa y costos. Toda regla de negocio va aquí y tiene pruebas.
4. `src/lib/`: infraestructura (`supabase/`, `ai/`).

Las primitivas visuales compartidas van en `src/ui/`.

### IA
- El resto de la app usa solo la interfaz `AiClient` de `src/lib/ai/`, configurada con `AI_BASE_URL`, `AI_API_KEY` y `AI_MODEL`. Ningún otro módulo sabe qué proveedor hay detrás.
- La IA **solo propone recetas y combinaciones** (ids del catálogo). Las cantidades, el escalado, la lista de mercado y los costos se calculan siempre en `src/domain/`.
- Toda respuesta se valida con zod. Los errores (`timeout`, `unavailable`, `invalid_response`, `not_configured`) se muestran al usuario con opción de reintentar y sin modificar sus datos.
- `AI_MODEL` puede ser una lista separada por comas: el cliente pasa al siguiente modelo si uno se queda sin cupo, falla o tarda (no si la clave es inválida). En producción se usa Groq gratis, que tiene cupo por modelo.
- Al proponer, las casillas que el modelo deje vacías las completa `fillEmptySlots` (`features/assistant/pick-recipe.ts`) con la misma regla de variedad y costo del asistente simulado.
- Nutrición (planes pagos): cada ingrediente puede tener `nutrients` (por 100 g, 100 ml o unidad); los de base están en `src/seed/nutrients.ts`, aproximados (ICBF/USDA). `src/domain/nutrition.ts` estima por porción y por persona/día. Se muestra siempre como aproximado y sin recomendaciones.
- Al cambiar `src/seed`, `npm run db:seed-sql` regenera `supabase/seed.sql`; el CLI a veces solo actualiza el hash de la semilla sin ejecutarla, así que hay que confirmar que los datos quedaron en la base.
- Las pruebas nunca llaman a la IA real: usan un cliente simulado.
- `AI_BASE_URL=mock` activa un asistente de reglas (`features/assistant/simulated-client.ts`) que pasa por el mismo esquema y la misma depuración. Instrucciones para probar fallas: «simular error», «simular lento», «simular respuesta inválida».
- Planes: Gratis (sin asistente), Básico (5 consultas/día) y Pro (20/día), mensual o trimestral, con 7 días de Pro gratis una vez. Los precios viven en `plan_prices` (la base fija el monto de cada pago). Cobro con el checkout de Wompi (`src/lib/wompi`, `features/billing`): `create_payment` crea el pago, `apply_payment` (solo service_role, idempotente) activa o extiende el plan cuando Wompi lo aprueba, desde el aviso firmado (`/api/wompi/eventos`) o al volver a `/planes/resultado`. El plan vence (`expires_at`) y vuelve solo a gratis; no hay cobro automático todavía.
- Legal: `/terminos`, `/privacidad` (Ley 1581) y `/reembolsos` (retracto de 5 días hábiles) son públicas, en `app/(legal)`. Los datos del responsable salen de `LEGAL_*` (`features/legal/owner.ts`); si falta uno, el build falla. El registro exige aceptar y guarda `legal_version` y `legal_accepted_at` en los metadatos del usuario. Si cambian los textos, sube `LEGAL_VERSION`.
- Admin: `/admin` (en `features/admin`) solo para los correos de `ADMIN_EMAILS`; para cualquier otro responde 404. Lee todo con la llave de servicio y calcula las métricas en `metrics.ts` (funciones puras, días en hora de Colombia).
- El asistente es solo de los planes pagos y tiene tope diario. El plan vive en `household_entitlements`, que los usuarios no pueden escribir; el cupo se descuenta en la base (`consume_ai_request`) antes de llamar a la IA y se devuelve si la IA falla. Mientras no haya pagos, el plan se cambia con `npm run plan:set -- <correo> <pro|free> [consultas por día]`.
- La respuesta del modelo nunca se aplica tal cual: `sanitize.ts` descarta ids inventados y recetas con algo de «no incluir», y la persona revisa la vista previa antes de aplicar.

## Convenciones
- El código va en inglés (identificadores y archivos) y la interfaz y las rutas en español (`/semana`, `/mercado`).
- El dinero se maneja en COP como enteros; se formatea con `Intl.NumberFormat("es-CO")`.
- Las unidades canónicas son `g`, `ml` y `unit`; la conversión vive en `src/domain/units.ts`. Una libra son 500 g.
- Las pruebas van junto al código (`*.test.ts`).
- Los secretos van solo en `.env.local`; `.env.example` documenta cada variable.
- Commits pequeños con mensajes claros en español, en imperativo.

## Comandos
```bash
npm install
npm run dev         # http://localhost:3000
npm run test        # Vitest (una vez); npm run test:watch para modo observación
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run check       # typecheck + lint + test
npm run build       # build de producción
npm run format      # Prettier

# Base de datos (Supabase Cloud; usa SUPABASE_DB_PASSWORD y SUPABASE_POOLER_HOST de .env.local)
npm run db:seed-sql # regenera supabase/seed.sql desde src/seed
npm run db:push     # aplica migraciones pendientes y la semilla
npm run db:types    # regenera src/lib/supabase/database.types.ts
npm run plan:set -- <correo> pro 20   # da el plan Pro a un hogar (sin pagos todavía)
```

## Base de datos
- Cada cambio de esquema es una migración nueva en `supabase/migrations/`; nunca se edita una ya aplicada.
- Toda tabla nueva lleva RLS y una prueba en `supabase/tests/` (corre sobre PGlite, sin red).
- Con Cache Components, todo lo que lea la sesión va dentro de `<Suspense>` con un esqueleto como fallback.
- `createSupabaseServerClient()` llama `connection()`: el cliente de Supabase usa la hora actual para validar la sesión, y Next no la permite al prerenderizar. No crear clientes de Supabase por otra vía en el servidor.
- Leer `usePathname()`/`useSearchParams()` en rutas dinámicas también exige `<Suspense>`.
