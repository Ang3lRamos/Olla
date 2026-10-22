import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { TextField } from "@/ui/text-field";

const SWATCHES = [
  { name: "Lienzo", token: "canvas", className: "bg-canvas", use: "Fondo" },
  { name: "Hundido", token: "sunken", className: "bg-sunken", use: "Zonas y hoy" },
  { name: "Tinta", token: "ink", className: "bg-ink", use: "Texto" },
  { name: "Achiote", token: "achiote", className: "bg-achiote", use: "Único acento" },
  { name: "Cilantro", token: "cilantro", className: "bg-cilantro", use: "Comprado, despensa" },
  { name: "Maíz", token: "maiz", className: "bg-maiz", use: "Hoy (solo marcador)" },
];

export function TokensPreview() {
  return (
    <section className="grid gap-10 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <h2 className="letrero text-xl">Color</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SWATCHES.map((swatch) => (
            <li key={swatch.token} className="flex flex-col gap-1.5">
              <span className={`h-14 rounded-sm border border-hairline ${swatch.className}`} />
              <span className="text-sm font-medium">{swatch.name}</span>
              <span className="text-xs text-muted">{swatch.use}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="letrero text-xl">Tipografía</h2>
        <p className="font-display text-display font-semibold">Sudado de pollo</p>
        <p className="letrero text-3xl">Lun · Mar · Mié</p>
        <p className="max-w-prose text-[15px] leading-relaxed">
          Instrument Sans para leer recetas y listas. Bricolage Grotesque para títulos y, en su versión
          condensada, para los rótulos de días y totales, como los letreros pintados a mano de la plaza.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="letrero text-xl">Controles</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Generar mercado</Button>
          <Button variant="secondary">Editar precios</Button>
          <Button variant="ghost">Cancelar</Button>
        </div>
        <Checkbox label="Plátano maduro · 3 unidades" />
      </div>

      <div className="flex max-w-sm flex-col gap-4">
        <h2 className="letrero text-xl">Formularios</h2>
        <TextField label="¿Cuántas personas comen?" defaultValue="4" inputMode="numeric" />
        <TextField
          label="Qué no incluir"
          placeholder="Ej.: cerdo, maní"
          hint="Lo tiene en cuenta el asistente."
        />
      </div>
    </section>
  );
}
