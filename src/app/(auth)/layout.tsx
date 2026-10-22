import { Logo } from "@/ui/brand/logo";
import { ThemeToggle } from "@/ui/theme/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-[8vh] pb-16 md:items-center md:pt-0">
        <div className="flex w-full max-w-sm animate-rise flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}
