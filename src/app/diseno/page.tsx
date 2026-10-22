import type { Metadata } from "next";
import { CheckEmailPreview } from "./_components/check-email-preview";
import { ReceiptPreview } from "./_components/receipt-preview";
import { TokensPreview } from "./_components/tokens-preview";
import { WeekPreview } from "./_components/week-preview";
import { Logo } from "@/ui/brand/logo";
import { ThemeToggle } from "@/ui/theme/theme-toggle";

export const metadata: Metadata = { title: "Dirección visual" };

export default function DesignPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-10 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="letrero text-sm text-muted">Dirección visual</p>
          <p className="max-w-2xl text-muted">
            Propuesta para validar antes de construir las pantallas. Todos los datos son de ejemplo.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <WeekPreview />

      <div className="grid items-start gap-10 md:grid-cols-[auto_1fr]">
        <ReceiptPreview />
        <TokensPreview />
      </div>

      <CheckEmailPreview />
    </main>
  );
}
