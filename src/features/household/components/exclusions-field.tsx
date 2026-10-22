"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/ui/text-field";
import { parseExclusions } from "../schemas";

interface ExclusionsFieldProps {
  defaultValue: string;
  error?: string;
}

/** Campo de texto separado por comas, con vista previa en etiquetas que se pueden quitar. */
export function ExclusionsField({ defaultValue, error }: ExclusionsFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const items = parseExclusions(value);

  const remove = (item: string) => setValue(items.filter((current) => current !== item).join(", "));

  return (
    <div className="flex flex-col gap-2">
      <TextField
        label="¿Qué no incluir en el menú? (opcional)"
        name="exclude"
        autoComplete="off"
        placeholder="Ej.: cerdo, maní, mariscos"
        hint="Sepáralos con comas. El asistente no los propondrá."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={error}
      />
      {items.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Elementos excluidos">
          {items.map((item) => (
            <li
              key={item.toLocaleLowerCase("es")}
              className="flex animate-rise items-center gap-1 rounded-full border border-hairline bg-sunken py-0.5 pr-1 pl-2.5 text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label={`Quitar ${item}`}
                className="grid size-5 place-items-center rounded-full text-muted transition-colors duration-(--dur-fast) ease-out hover:bg-hairline hover:text-ink"
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
