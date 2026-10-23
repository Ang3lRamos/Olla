"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DOCUMENTS = [
  { href: "/terminos", label: "Términos" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/reembolsos", label: "Reembolsos" },
];

export function LegalNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentos legales" className="border-b border-hairline">
      <ul className="flex gap-6 text-sm">
        {DOCUMENTS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className="-mb-px inline-block border-b-2 border-transparent py-3 text-muted transition-colors duration-(--dur-fast) ease-out hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
