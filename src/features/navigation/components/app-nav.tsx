"use client";

import {
  BookOpen,
  CalendarDays,
  NotebookPen,
  Package,
  PiggyBank,
  Settings,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/ui/cn";

interface Section {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** En celular vive en el menú de la cuenta para no saturar la barra inferior. */
  desktopOnly?: boolean;
}

/** Crece con cada funcionalidad: solo se listan secciones que ya existen. */
const SECTIONS: Section[] = [
  { href: "/semana", label: "Semana", Icon: CalendarDays },
  { href: "/mercado", label: "Mercado", Icon: ShoppingBasket },
  { href: "/recetas", label: "Recetas", Icon: BookOpen },
  { href: "/despensa", label: "Despensa", Icon: Package },
  { href: "/notas", label: "Notas", Icon: NotebookPen },
  { href: "/presupuesto", label: "Presupuesto", Icon: PiggyBank, desktopOnly: true },
  { href: "/ajustes", label: "Ajustes", Icon: Settings, desktopOnly: true },
];
const MOBILE_SECTIONS = SECTIONS.filter((section) => !section.desktopOnly);

type IsActive = (href: string) => boolean;

/** Ninguna sección activa: lo que se muestra mientras se conoce la ruta. */
const NONE_ACTIVE: IsActive = () => false;

function useActiveSection(): IsActive {
  const pathname = usePathname();
  return (href) => pathname === href || pathname.startsWith(`${href}/`);
}

// Leer la ruta en una ruta dinámica exige <Suspense>; el layout usa estas versiones
// sin sección activa como respaldo, así la barra aparece de inmediato.
export const AppNav = () => <TopLinks isActive={useActiveSection()} />;
export const AppNavFallback = () => <TopLinks isActive={NONE_ACTIVE} />;
export const MobileTabBar = () => <TabBar isActive={useActiveSection()} />;
export const MobileTabBarFallback = () => <TabBar isActive={NONE_ACTIVE} />;

/** Enlaces en la barra superior, desde tableta. */
function TopLinks({ isActive }: { isActive: IsActive }) {
  return (
    <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
      {SECTIONS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "relative rounded-md px-3 py-1.5 text-sm transition-colors duration-(--dur-fast) ease-out",
            isActive(href) ? "font-medium text-ink" : "text-muted hover:text-ink",
          )}
        >
          {label}
          <span
            aria-hidden
            className={cn(
              "absolute inset-x-3 -bottom-[11px] h-0.5 origin-left rounded-full bg-accent",
              "transition-transform duration-(--dur-base) ease-out",
              isActive(href) ? "scale-x-100" : "scale-x-0",
            )}
          />
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior fija en celular, al alcance del pulgar. */
function TabBar({ isActive }: { isActive: IsActive }) {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${MOBILE_SECTIONS.length}, minmax(0, 1fr))` }}
      >
        {MOBILE_SECTIONS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors duration-(--dur-fast) ease-out",
                isActive(href) ? "font-medium text-ink" : "text-muted active:text-ink",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-(--dur-base) ease-out",
                  isActive(href) && "-translate-y-px",
                )}
                strokeWidth={isActive(href) ? 2.25 : 1.75}
                aria-hidden
              />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
