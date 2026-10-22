@AGENTS.md

# Olla

Aplicación web de planeación de comidas para hogares en Colombia: recetas, despensa, menú semanal, lista de mercado, presupuesto en COP, notas y un asistente de IA que propone menús. Proyecto de portafolio con calidad de producto, preparado para convertirse en SaaS por suscripción (el hogar es la unidad de cobro). Hoy solo corre en local.

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
- Las pruebas nunca llaman a la IA real: usan un cliente simulado.
- `AI_BASE_URL=mock` activa un asistente de reglas (`features/assistant/simulated-client.ts`) que pasa por el mismo esquema y la misma depuración. Instrucciones para probar fallas: «simular error», «simular lento», «simular respuesta inválida».
- El asistente es solo del plan Pro y tiene tope diario. El plan vive en `household_entitlements`, que los usuarios no pueden escribir; el cupo se descuenta en la base (`consume_ai_request`) antes de llamar a la IA y se devuelve si la IA falla. Mientras no haya pagos, el plan se cambia con `npm run plan:set -- <correo> <pro|free> [consultas por día]`.
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
