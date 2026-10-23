import Link from "next/link";
import { AuthShowcase } from "@/features/auth/components/auth-showcase";
import { Logo } from "@/ui/brand/logo";
import { ThemeToggle } from "@/ui/theme/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    // En escritorio todo cabe en la ventana: si un formulario largo no cabe, solo su columna se desplaza.
    <div className="grid min-h-full flex-1 lg:h-dvh lg:min-h-0 lg:flex-none lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <div className="flex flex-col px-4 md:px-10 lg:overflow-y-auto">
        <header className="flex items-center justify-between py-4">
          <Logo />
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-start justify-center pt-4 pb-6 md:items-center md:py-4">
          <div className="flex w-full max-w-sm animate-rise flex-col gap-6 md:gap-8">{children}</div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 text-xs text-muted">
          <span>Hecho en Colombia · Precios en pesos colombianos</span>
          <nav aria-label="Documentos legales" className="flex gap-4">
            <Link href="/terminos" className="transition-colors duration-(--dur-fast) hover:text-ink">
              Términos
            </Link>
            <Link href="/privacidad" className="transition-colors duration-(--dur-fast) hover:text-ink">
              Privacidad
            </Link>
          </nav>
        </footer>
      </div>
      <AuthShowcase className="hidden lg:flex" />
    </div>
  );
}
