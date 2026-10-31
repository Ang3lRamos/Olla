import { Checkbox } from "@/ui/checkbox";

interface LeftoverPurchasesProps {
  names: string[];
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const listText = (names: string[]) =>
  names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;

/** Lo que la persona dijo que iba a mercar y ninguna receta usa: puede quedar como extra del mercado. */
export function LeftoverPurchases({ names, checked, onChange }: LeftoverPurchasesProps) {
  if (names.length === 0) return null;
  return (
    <div className="rounded-md bg-sunken px-3 py-2.5 text-sm">
      <Checkbox
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        label={
          <span>
            Agregar al mercado <span className="font-medium">{listText(names)}</span>: lo ibas a mercar y
            ninguna receta del menú lo usa.
          </span>
        }
      />
    </div>
  );
}
