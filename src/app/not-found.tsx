import Link from "next/link";
import { Logo } from "@/ui/brand/logo";
import { buttonClasses } from "@/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 animate-rise flex-col justify-center gap-6 px-4 py-16">
      <Logo />
      <div className="flex flex-col gap-2">
        <p className="letrero text-sm text-muted">Error 404</p>
        <h1 className="font-display text-title font-semibold">Esta página no está en el menú</h1>
        <p className="text-muted">Puede que el enlace esté viejo o que la receta ya no exista.</p>
      </div>
      <Link href="/semana" className={buttonClasses({ className: "w-fit" })}>
        Volver a la semana
      </Link>
    </main>
  );
}
