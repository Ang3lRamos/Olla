"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import type { IsoDate, Meal } from "@/domain/week";
import { deleteNote, saveNote } from "@/features/notes/actions";
import { MAX_NOTE_LENGTH } from "@/features/notes/schemas";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import type { NoteView } from "../week-view";

interface NotesPanelProps {
  date: IsoDate;
  meal: Meal | null;
  notes: NoteView[];
  placeholder: string;
}

export function NotesPanel({ date, meal, notes, placeholder }: NotesPanelProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();
  const [deletingId, setDeletingId] = useState<string>();

  const add = () =>
    startSaving(async () => {
      const result = await saveNote({ id: null, date, meal, body: draft });
      if (result.ok) setDraft("");
      setError(result.ok ? undefined : result.error);
    });

  const remove = (noteId: string) => {
    setDeletingId(noteId);
    startSaving(async () => {
      const result = await deleteNote(noteId);
      setError(result.ok ? undefined : result.error);
      setDeletingId(undefined);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {notes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className={cn(
                "flex animate-rise items-start justify-between gap-2 rounded-md bg-sunken px-3 py-2 text-[15px]",
                "transition-opacity duration-(--dur-fast)",
                deletingId === note.id && "opacity-40",
              )}
            >
              <p className="whitespace-pre-line">{note.body}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-my-1 -mr-1.5 px-1.5 text-muted hover:text-danger"
                aria-label="Borrar nota"
                onClick={() => remove(note.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <label className="sr-only" htmlFor={`note-${date}-${meal ?? "day"}`}>
          Nueva nota
        </label>
        <textarea
          id={`note-${date}-${meal ?? "day"}`}
          rows={2}
          maxLength={MAX_NOTE_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className="rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] transition-colors duration-(--dur-fast) ease-out placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
        />
        {error && (
          <p role="alert" className="animate-rise text-sm text-danger">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="w-fit"
          loading={saving && !deletingId}
          disabled={!draft.trim()}
        >
          Guardar nota
        </Button>
      </form>
    </div>
  );
}
