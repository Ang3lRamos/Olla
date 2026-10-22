"use client";

import { CalendarDays, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { MEAL_LABELS, startOfWeek, weekdayLabels } from "@/domain/week";
import { buttonClasses, Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { FormMessage } from "@/ui/form-message";
import { deleteNote } from "../actions";
import type { Note } from "../data";

const LONG_DATE = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", timeZone: "UTC" });

function dateHeading(date: string) {
  return `${weekdayLabels(date).long} ${LONG_DATE.format(new Date(`${date}T00:00:00Z`))}`;
}

export function NotesTimeline({ notes }: { notes: Note[] }) {
  const [deletingId, setDeletingId] = useState<string>();
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  const remove = (noteId: string) => {
    setDeletingId(noteId);
    startTransition(async () => {
      const result = await deleteNote(noteId);
      setError(result.ok ? undefined : result.error);
      setDeletingId(undefined);
    });
  };

  if (notes.length === 0) {
    return (
      <div className="max-w-2xl rounded-md border border-dashed border-hairline-strong p-6 text-muted">
        <p className="font-medium text-ink">Todavía no hay notas.</p>
        <p className="mt-1 text-sm">
          Desde la semana, toca una comida o el ícono de nota de un día para anotar cosas como «sobró arroz» o
          «a los niños no les gustó».
        </p>
      </div>
    );
  }

  const dates = [...new Set(notes.map((note) => note.date))];

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {error && <FormMessage tone="error">{error}</FormMessage>}
      {dates.map((date) => (
        <section key={date} aria-labelledby={`notes-${date}`} className="animate-rise">
          <header className="mb-2 flex items-baseline justify-between gap-3 border-b-2 border-ink pb-1">
            <h2 id={`notes-${date}`} className="letrero text-lg">
              {dateHeading(date)}
            </h2>
            <Link
              href={`/semana?semana=${startOfWeek(date)}`}
              className={buttonClasses({ variant: "ghost", size: "sm", className: "text-muted" })}
            >
              <CalendarDays className="size-4" aria-hidden />
              Ver semana
            </Link>
          </header>
          <ul className="flex flex-col divide-y divide-hairline">
            {notes
              .filter((note) => note.date === date)
              .map((note) => (
                <li
                  key={note.id}
                  className={cn(
                    "flex items-start justify-between gap-3 py-3 transition-opacity duration-(--dur-fast)",
                    deletingId === note.id && "opacity-40",
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted">
                      {note.meal ? MEAL_LABELS[note.meal] : "Todo el día"}
                    </span>
                    <p className="text-[15px] whitespace-pre-line">{note.body}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-muted hover:text-danger"
                    aria-label="Borrar nota"
                    onClick={() => remove(note.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
