"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/ui/cn";

/** Crece con cada funcionalidad: solo se listan secciones que ya existen. */
const SECTIONS = [{ href: "/ajustes", label: "Ajustes" }] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones" className="flex items-center gap-1">
      {SECTIONS.map((section) => {
        const active = pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-md px-3 py-1.5 text-sm transition-colors duration-(--dur-fast) ease-out",
              active ? "font-medium text-ink" : "text-muted hover:text-ink",
            )}
          >
            {section.label}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-3 -bottom-[11px] h-0.5 origin-left rounded-full bg-achiote",
                "transition-transform duration-(--dur-base) ease-out",
                active ? "scale-x-100" : "scale-x-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
