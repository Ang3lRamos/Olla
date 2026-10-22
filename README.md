# Olla

Planeación de comidas para hogares en Colombia: el menú de la semana, la lista de mercado que sale sola, el presupuesto en pesos y un asistente de IA que propone recetas sin decidir los números.

**Demo:** https://olla-alpha.vercel.app

## Qué hace

- **Semana.** Calendario de 7 días × 3 comidas (desayuno, almuerzo y comida). Cada comida puede tener sus propias personas ("el sábado vienen visitas") y notas ("sobró arroz").
- **Recetas.** 30 recetas colombianas de base (ajiaco, sancocho, fríjoles, changua, sudado…) y las propias del hogar. El detalle escala las porciones en vivo, con fracciones de cocina ("1 ½ libras") y costo por ingrediente.
- **Despensa.** Lo que hay en casa, con cantidades aproximadas.
- **Mercado.**
  - Sale del menú, suma lo repetido, convierte unidades (g/kg/libra, ml/l/taza, unidades) y resta la despensa.
  - Agrupa por categoría en el orden en que se recorre la plaza.
  - Se marca lo comprado y se puede copiar como texto para WhatsApp.
  - Si el menú cambia después de comprar, avisa cuánto falta.
- **Presupuesto.** Precios propios en COP sobre precios de referencia, costo por día y comparación con el presupuesto semanal.
- **Asistente (plan Pro).**
  - Propone la semana, la ajusta con lenguaje natural ("esta semana estoy corto de plata") y lee las notas para aprovechar sobrantes.
  - Muestra la propuesta antes de aplicarla, con su impacto en el mercado.

Fuera de alcance a propósito: calorías, dietas o consejo nutricional. El producto es organización, variedad y presupuesto.

## Decisiones de diseño que vale la pena mirar

- **La IA elige, el código calcula.**
  - El modelo solo devuelve ids de recetas del catálogo.
  - Cantidades, escalado, mercado y costos salen de funciones puras en [`src/domain`](src/domain), con pruebas.
  - La respuesta se valida con zod y luego se depura ([`sanitize.ts`](src/features/assistant/sanitize.ts)): se descartan ids inventados y recetas con algo de lo que el hogar pidió no incluir.
- **IA intercambiable y tolerante a fallas.**
  - [`src/lib/ai`](src/lib/ai) habla con cualquier API compatible con OpenAI. Hoy es OmniRoute en local; mañana, un proveedor de pago, cambiando solo el `.env`.
  - Si el proveedor tarda o falla (timeout, 429/5xx), reintenta con espera creciente.
  - Si el JSON no cumple el esquema, vuelve a pedirlo explicando qué estuvo mal.
  - Si el proveedor no soporta `response_format`, repite la petición sin él.
  - Para la interfaz, cada falla tiene su mensaje y la opción de reintentar.
- **Multi-hogar con RLS.** El hogar es la unidad de datos y de cobro. Todas las tablas tienen RLS por membresía, y las políticas se prueban sobre Postgres real (PGlite) en [`supabase/tests`](supabase/tests).
- **Plan y cupo que el cliente no puede falsear.**
  - El plan vive en una tabla de solo lectura para los usuarios.
  - El cupo diario del asistente se descuenta en la base con una función atómica y se devuelve si la IA falla.
- **La lista de mercado no se guarda.** Se calcula siempre desde el menú; solo se persiste lo comprado y cuánto, para detectar cambios del menú después de comprar.

## Stack

- Next.js 16 (App Router, Server Actions, Cache Components) con TypeScript estricto.
- Tailwind CSS v4 con tokens propios en [`src/styles/tokens.css`](src/styles/tokens.css). Tema claro y oscuro, accesible (WCAG 2.1 AA, verificado con axe) y con movimiento que respeta `prefers-reduced-motion`.
- Supabase (Postgres, Auth y RLS). Las migraciones están en [`supabase/migrations`](supabase/migrations).
- zod para validar formularios, acciones y respuestas de la IA.
- Vitest para el dominio, la IA (con clientes simulados), los esquemas y las políticas de la base.

## Estructura

```
src/
  app/          rutas: (auth) ingreso, registro y onboarding; (app) semana, mercado, recetas…
  domain/       reglas puras: unidades, escalado, consolidación, despensa, costos, fechas
  features/     una carpeta por funcionalidad: componentes, acciones, datos y esquemas
  lib/          infraestructura: cliente de IA y clientes de Supabase
  seed/         recetas e ingredientes de base (generan supabase/seed.sql)
  ui/           primitivas: botón, campos, diálogo, panel, tema
supabase/       migraciones, semilla y pruebas del esquema y la RLS
```

## Correr en local

1. `npm install`
2. Copia `.env.example` a `.env.local` y completa los valores. Cada variable está documentada ahí.
   - Con `AI_BASE_URL=mock` el asistente funciona en modo simulado, sin proveedor real.
3. `npm run db:push`: aplica las migraciones y la semilla al proyecto de Supabase.
4. `npm run dev` y abre http://localhost:3000.

```bash
npm run check                                 # typecheck + lint + pruebas
npm run build                                 # build de producción
npm run db:types                              # regenera los tipos de la base
npm run plan:set -- correo@x.com pro 20       # da el plan Pro (mientras no hay pagos)
npm run plan:set -- correo@x.com pro ilimitado
```

Las convenciones del proyecto están en [CLAUDE.md](CLAUDE.md).
