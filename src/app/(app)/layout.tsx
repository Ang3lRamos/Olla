import Link from "next/link";
import { Suspense } from "react";
import {
  AppNav,
  AppNavFallback,
  MobileTabBar,
  MobileTabBarFallback,
} from "@/features/navigation/components/app-nav";
import { UserMenu } from "@/features/navigation/components/user-menu";
import { Logo } from "@/ui/brand/logo";
import { Skeleton } from "@/ui/skeleton";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 md:px-8">
          <Link href="/" aria-label="Olla, inicio" className="rounded-md">
            <Logo />
          </Link>
          <Suspense fallback={<AppNavFallback />}>
            <AppNav />
          </Suspense>
          <div className="ml-auto">
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      {/* En celular deja espacio para la barra inferior fija. */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-8 pb-28 md:px-8 md:py-10">
        {children}
      </main>
      <Suspense fallback={<MobileTabBarFallback />}>
        <MobileTabBar />
      </Suspense>
    </div>
  );
}
