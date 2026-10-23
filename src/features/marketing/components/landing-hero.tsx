import Link from "next/link";
import { Logo } from "@/ui/brand/logo";
import { buttonClasses } from "@/ui/button";
import { ThemeToggle } from "@/ui/theme/theme-toggle";
import { SampleMarketTicket, SampleWeekCard } from "./sample-week";

const NAV_LINK =
  "rounded-sm text-sm text-muted transition-colors duration-(--dur-fast) ease-out hover:text-ink";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 md:px-8">
        <Link href="/" aria-label="Olla, inicio" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Secciones" className="hidden gap-6 md:flex">
          <a href="#como-funciona" className={NAV_LINK}>
            Cómo funciona
          </a>
          <a href="#precios" className={NAV_LINK}>
            Precios
          </a>
          <a href="#preguntas" className={NAV_LINK}>
            Preguntas
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link href="/ingresar" className={buttonClasses({ variant: "ghost", size: "sm" })}>
            Ingresar
          </Link>
          <Link href="/registro" className={buttonClasses({ size: "sm" })}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Portada: la promesa en una frase y, al lado, Olla por dentro en vez de una ilustración. */
export function LandingHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-16 md:px-8 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pb-24">
      <div className="flex animate-rise flex-col gap-6">
        <p className="letrero text-sm text-muted">Para la cocina de la casa</p>
        <h1 className="font-display text-[2.6rem] leading-[1.02] font-semibold tracking-tight text-balance md:text-6xl">
          El menú de la semana y el mercado, <span className="marcador">en pesos</span>.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted">
          Planea qué van a comer, arma la lista sin repetir lo que ya hay en la despensa y sabe cuánto vas a
          gastar antes de salir a la tienda.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/registro" className={buttonClasses({ className: "h-12 px-6 text-base" })}>
            Crear cuenta gratis
          </Link>
          <p className="text-sm text-muted">Gratis y sin tarjeta, con un menú del asistente cada semana.</p>
        </div>
      </div>
      <div aria-hidden className="relative mx-auto w-full max-w-[540px] pr-6 pb-32 sm:pr-10">
        <SampleWeekCard />
        <SampleMarketTicket className="absolute right-0 bottom-0 w-[240px] sm:w-[260px]" />
      </div>
    </section>
  );
}
