"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { acceptInvite } from "../actions";

/** Aceptar la invitación; si sale bien, la acción lleva directo a la semana del hogar. */
export function JoinInvite({ token, householdName }: { token: string; householdName: string }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Button
        className="w-full"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvite(token);
            if (!result.ok) setError(result.error);
          })
        }
      >
        Unirme a {householdName}
      </Button>
    </div>
  );
}
