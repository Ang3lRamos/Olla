import Image from "next/image";
import { cn } from "../cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image src="/brand/olla-logo.png" alt="" width={36} height={36} priority />
      <span className="font-display text-2xl font-semibold tracking-tight">Olla</span>
    </span>
  );
}
