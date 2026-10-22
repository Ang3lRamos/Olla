import type { Metadata } from "next";
import { Suspense } from "react";
import { requireHousehold } from "@/features/household/data";
import { NotesTimeline } from "@/features/notes/components/notes-timeline";
import { listRecentNotes } from "@/features/notes/data";
import { Skeleton } from "@/ui/skeleton";

export const metadata: Metadata = { title: "Notas" };

const RECENT_NOTES_LIMIT = 200;

async function Notes() {
  await requireHousehold();
  return <NotesTimeline notes={await listRecentNotes(RECENT_NOTES_LIMIT)} />;
}

export default function NotesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-title font-semibold md:text-display">Notas</h1>
        <p className="max-w-2xl text-muted">
          Lo que anotas en la semana: sobrantes, gustos y lo que conviene repetir o evitar.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex max-w-2xl flex-col gap-3" role="status" aria-label="Cargando notas">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-14" />
            ))}
          </div>
        }
      >
        <Notes />
      </Suspense>
    </div>
  );
}
