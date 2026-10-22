import { AuthShowcase } from "@/features/auth/components/auth-showcase";
import { Logo } from "@/ui/brand/logo";
import { ThemeToggle } from "@/ui/theme/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-4 md:px-10">
        <header className="flex items-center justify-between py-4">
          <Logo />
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-start justify-center pt-[6vh] pb-12 md:items-center md:pt-0">
          <div className="flex w-full max-w-sm animate-rise flex-col gap-8">{children}</div>
        </main>
        <footer className="py-6 text-xs text-muted">Hecho en Colombia · Precios en pesos colombianos</footer>
      </div>
      <AuthShowcase className="hidden lg:flex" />
    </div>
  );
}
