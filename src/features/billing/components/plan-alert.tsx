"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button, buttonClasses } from "@/ui/button";
import { cn } from "@/ui/cn";
import type { PlanNotice } from "../plan-notice";
import { noticeCopy } from "../plan-notice-copy";
import { usePlanReminder } from "./use-plan-reminder";

interface PlanAlertProps {
  notice: PlanNotice;
  /** Cambia con cada periodo (el vencimiento), para volver a avisar después de renovar. */
  noticeKey: string;
}

/**
 * Aviso del plan por vencer o vencido: una alerta al entrar, con "Ahora no" o "No recordar
 * más". Si pide no recordar más, queda una etiqueta roja en la barra con el tiempo que queda.
 */
export function PlanAlert({ notice, noticeKey }: PlanAlertProps) {
  const reminder = usePlanReminder(noticeKey);
  const copy = noticeCopy(notice);
  // En la página de planes la alerta sobra: la persona ya está donde se renueva.
  const onPlans = usePathname().startsWith("/planes");
  const ref = useRef<HTMLDialogElement>(null);
  const open = reminder.showAlert && !onPlans;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <>
      {reminder.showBadge && (
        <Link
          href="/planes"
          className={cn(
            "flex h-7 animate-rise items-center gap-1.5 rounded-full border border-danger/40 bg-danger/10 px-2.5 text-xs font-medium whitespace-nowrap text-danger",
            "transition-colors duration-(--dur-fast) ease-out hover:bg-danger/15",
          )}
        >
          <CalendarClock className="size-3.5" aria-hidden />
          {copy.badge}
          <span className="sr-only">. {copy.title}</span>
        </Link>
      )}
      <dialog
        ref={ref}
        onClose={reminder.later}
        aria-labelledby="plan-alert-title"
        className={cn(
          "m-auto w-[min(26rem,calc(100%-2rem))] rounded-md border border-hairline bg-surface p-6 text-ink shadow-raised",
          "scale-[0.96] opacity-0 transition-[opacity,transform,overlay,display] transition-discrete duration-(--dur-fast) ease-in",
          "open:scale-100 open:opacity-100 open:duration-(--dur-base) open:ease-out",
          "starting:open:scale-[0.96] starting:open:opacity-0",
          "backdrop:bg-transparent backdrop:transition-[background-color,overlay,display] backdrop:transition-discrete backdrop:duration-(--dur-base)",
          "open:backdrop:bg-scrim starting:open:backdrop:bg-transparent",
        )}
      >
        <CalendarClock
          className={cn("size-7", notice.kind === "ending" ? "text-danger" : "text-muted")}
          aria-hidden
        />
        <h2 id="plan-alert-title" className="mt-3 font-display text-xl font-semibold">
          {copy.title}
        </h2>
        <p className="mt-2 text-[15px] text-muted">{copy.body}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/planes" onClick={reminder.later} className={buttonClasses({ className: "w-full" })}>
            {copy.action}
          </Link>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={reminder.later} autoFocus>
              Ahora no
            </Button>
            <Button variant="ghost" className="flex-1 text-muted" onClick={reminder.dismiss}>
              No recordar más
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
