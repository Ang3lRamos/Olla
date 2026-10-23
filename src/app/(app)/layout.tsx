import Link from "next/link";
import { Suspense } from "react";
import {
  AppNav,
  AppNavFallback,
  MobileTabBar,
  MobileTabBarFallback,
} from "@/features/navigation/components/app-nav";
import { PlanAlertLoader } from "@/features/billing/components/plan-alert-loader";
import { HelpButton, HelpButtonFallback } from "@/features/help/components/help-button";
import { UserMenu } from "@/features/navigation/components/user-menu";
import { needsLegalUpdate } from "@/features/legal/acceptance";
import { LegalUpdateNotice } from "@/features/legal/components/legal-update-notice";
import { Logo } from "@/ui/brand/logo";
import { Skeleton } from "@/ui/skeleton";
import { HOME_PATH } from "@/lib/routes";

async function LegalNotice() {
  return (await needsLegalUpdate()) ? <LegalUpdateNotice /> : null;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a
        href="#contenido"
        className="sr-only z-20 rounded-md bg-accent px-3 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 md:px-8">
          <Link href={HOME_PATH} aria-label="Olla, inicio" className="rounded-md">
            <Logo />
          </Link>
          <Suspense fallback={<AppNavFallback />}>
            <AppNav />
          </Suspense>
          <div className="ml-auto flex items-center gap-2">
            <Suspense fallback={null}>
              <PlanAlertLoader />
            </Suspense>
            <Suspense fallback={<HelpButtonFallback />}>
              <HelpButton />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <Suspense fallback={null}>
        <LegalNotice />
      </Suspense>
      {/* En celular deja espacio para la barra inferior fija. */}
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-8 pb-28 outline-none md:px-8 md:py-10"
      >
        {children}
      </main>
      <Suspense fallback={<MobileTabBarFallback />}>
        <MobileTabBar />
      </Suspense>
    </div>
  );
}
