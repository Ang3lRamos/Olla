import type { ReactNode } from "react";

/** Un número que se lee de un vistazo, con su contexto debajo. */
export function StatTile({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-hairline p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-display text-2xl font-semibold tabular-nums">{value}</dd>
      {detail && <dd className="text-xs text-muted">{detail}</dd>}
    </div>
  );
}
