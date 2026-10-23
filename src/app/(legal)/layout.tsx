import Link from "next/link";
import { LegalNav } from "@/features/legal/components/legal-nav";
import { Logo } from "@/ui/brand/logo";
import { ThemeToggle } from "@/ui/theme/theme-toggle";

/** Páginas públicas: se leen con o sin sesión, también antes de registrarse o pagar. */
export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 md:px-0">
      <header className="flex items-center justify-between py-4">
        <Link href="/" aria-label="Olla, ir al inicio" className="rounded-sm">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <LegalNav />
      <main className="flex-1 py-10 md:py-14">{children}</main>
      <footer className="border-t border-hairline py-6 text-xs text-muted">
        Hecho en Colombia · Precios en pesos colombianos
      </footer>
    </div>
  );
}
