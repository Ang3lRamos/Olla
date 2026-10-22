"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import type { AiErrorKind } from "@/lib/ai/types";
import { Button, buttonClasses } from "@/ui/button";
import type { PlanErrorKind } from "../actions";
import { ASSISTANT_ERROR_MESSAGES } from "./assistant-messages";

/** Reintentar solo tiene sentido si la falla fue del proveedor, no de la configuración o del plan. */
const NOT_RETRIABLE = new Set<AiErrorKind | PlanErrorKind>([
  "not_configured",
  "not_entitled",
  "limit_reached",
]);

interface AssistantErrorProps {
  kind: AiErrorKind | PlanErrorKind;
  onRetry?: () => void;
  onBack?: () => void;
}

export function AssistantError({ kind, onRetry, onBack }: AssistantErrorProps) {
  const message = ASSISTANT_ERROR_MESSAGES[kind];
  return (
    <div role="alert" className="flex animate-rise flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-medium">{message.title}</p>
        <p className="text-sm text-muted">{message.body}</p>
      </div>
      <div className="flex gap-2">
        {(kind === "not_entitled" || kind === "limit_reached") && (
          <Link href="/planes" className={buttonClasses({})}>
            {kind === "not_entitled" ? "Ver planes" : "Mejorar mi plan"}
          </Link>
        )}
        {onRetry && !NOT_RETRIABLE.has(kind) && (
          <Button onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden />
            Reintentar
          </Button>
        )}
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Volver
          </Button>
        )}
      </div>
    </div>
  );
}
