"use client";

import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { cn } from "./cn";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Encabezado bajo el que se agrupa (p. ej. la categoría del ingrediente). */
  group?: string;
}

interface SelectProps<T extends string> {
  value: T | "";
  options: SelectOption<T>[];
  onValueChange: (value: T) => void;
  placeholder?: string;
  "aria-label"?: string;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
  /** Muestra un buscador arriba de la lista; útil con muchas opciones. */
  searchable?: boolean;
  /** Ofrece crear lo que se escribió cuando no está en la lista. */
  onCreate?: (text: string) => void;
}

/** Minúsculas y sin tildes, para que "frijol" encuentre "Fríjol". */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .trim();

const CREATE = "__crear__";
/** Espacio que necesita la lista abierta; si abajo no cabe, abre hacia arriba. */
const LIST_SPACE = 300;

/**
 * Lista desplegable con el estilo de Olla (la nativa del sistema no se puede estilizar).
 * Sigue el patrón combobox de ARIA: flechas, Enter, Escape y escribir para saltar a una opción.
 */
export function Select<T extends string>({
  value,
  options,
  onValueChange,
  placeholder = "Elige una opción",
  disabled,
  invalid,
  className,
  ref,
  searchable,
  onCreate,
  ...aria
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-${index}`;

  const visible = useMemo(() => {
    const needle = normalize(query);
    return needle ? options.filter((option) => normalize(option.label).includes(needle)) : options;
  }, [options, query]);
  const canCreate =
    onCreate !== undefined &&
    query.trim() !== "" &&
    !options.some((option) => normalize(option.label) === normalize(query));
  const items: Array<SelectOption<T> | typeof CREATE> = canCreate ? [...visible, CREATE] : visible;
  const selected = options.find((option) => option.value === value);

  const openList = () => {
    if (disabled) return;
    const box = triggerRef.current?.getBoundingClientRect();
    setDropUp(box ? window.innerHeight - box.bottom < LIST_SPACE && box.top > LIST_SPACE : false);
    setQuery("");
    setActive(
      Math.max(
        options.findIndex((option) => option.value === value),
        0,
      ),
    );
    setOpen(true);
  };

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const choose = (item: SelectOption<T> | typeof CREATE | undefined) => {
    if (!item) return;
    if (item === CREATE) onCreate?.(query.trim());
    else onValueChange(item.value);
    close();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    const last = items.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]!);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(items[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (!searchable && event.key.length === 1) {
      // Escribir una letra salta a la primera opción que empieza así.
      const index = options.findIndex((option) => normalize(option.label).startsWith(normalize(event.key)));
      if (index >= 0) setActive(index);
    }
  };

  const setTriggerRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={setTriggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && !searchable && items.length ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-hairline-strong bg-surface px-3 text-left text-[15px]",
          "transition-colors duration-(--dur-fast) ease-out hover:border-muted",
          "focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/15 focus-visible:outline-none",
          "disabled:opacity-50 aria-invalid:border-danger",
          open && "border-accent ring-3 ring-accent/15",
        )}
        {...aria}
      >
        <span className={cn("truncate", !selected && "text-muted")}>{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-(--dur-base) ease-out",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-30 w-full min-w-48 animate-rise overflow-hidden rounded-md border border-hairline bg-surface shadow-raised",
            dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {searchable && (
            <label className="flex items-center gap-2 border-b border-hairline px-3">
              <Search className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="sr-only">Buscar</span>
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-activedescendant={items.length ? optionId(active) : undefined}
                aria-autocomplete="list"
                placeholder="Buscar…"
                className="h-10 w-full bg-transparent text-[15px] placeholder:text-muted focus:outline-none"
              />
            </label>
          )}
          <OptionList
            listRef={listRef}
            listId={listId}
            label={aria["aria-label"]}
            items={items}
            value={value}
            active={active}
            query={query}
            optionId={optionId}
            onActive={setActive}
            onChoose={choose}
          />
        </div>
      )}
    </div>
  );
}

interface OptionListProps<T extends string> {
  listRef: Ref<HTMLUListElement>;
  listId: string;
  label?: string;
  items: Array<SelectOption<T> | typeof CREATE>;
  value: T | "";
  active: number;
  query: string;
  optionId: (index: number) => string;
  onActive: (index: number) => void;
  onChoose: (item: SelectOption<T> | typeof CREATE) => void;
}

function OptionList<T extends string>({
  listRef,
  listId,
  label,
  items,
  value,
  active,
  query,
  optionId,
  onActive,
  onChoose,
}: OptionListProps<T>) {
  const groupStarts = new Set(
    items.flatMap((item, index) => {
      const previous = items[index - 1];
      const group = item === CREATE ? undefined : item.group;
      const previousGroup = previous && previous !== CREATE ? previous.group : undefined;
      return group && group !== previousGroup ? [index] : [];
    }),
  );
  // El clic no debe quitar el foco del buscador o del botón antes de elegir.
  const keepFocus = (event: React.PointerEvent) => event.preventDefault();

  return (
    <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto py-1">
      {items.length === 0 && <li className="px-3 py-2 text-sm text-muted">No hay coincidencias.</li>}
      {items.map((item, index) => {
        const isCreate = item === CREATE;
        const selected = !isCreate && item.value === value;
        return [
          !isCreate && groupStarts.has(index) && (
            <li
              key={`g-${item.group}`}
              role="presentation"
              className="px-3 pt-2.5 pb-1 letrero text-[11px] text-muted"
            >
              {item.group}
            </li>
          ),
          <li
            key={isCreate ? CREATE : item.value}
            id={optionId(index)}
            data-index={index}
            role="option"
            aria-selected={selected}
            onPointerDown={keepFocus}
            onPointerMove={() => onActive(index)}
            onClick={() => onChoose(item)}
            className={cn(
              "mx-1 flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-[15px]",
              "transition-colors duration-(--dur-fast) ease-out",
              index === active && "bg-sunken",
              isCreate && "mt-1 border-t border-hairline font-medium",
            )}
          >
            {isCreate ? (
              <span className="flex items-center gap-2">
                <Plus className="size-4" aria-hidden />
                Crear «{query.trim()}»
              </span>
            ) : (
              item.label
            )}
            {selected && <Check className="size-4 shrink-0 text-cilantro" aria-hidden />}
          </li>,
        ];
      })}
    </ul>
  );
}
