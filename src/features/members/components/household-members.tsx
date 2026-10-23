"use client";

import { Check, Copy } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/ui/button";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { FormMessage } from "@/ui/form-message";
import { createInvite, leaveHousehold, removeMember, revokeInvite } from "../actions";
import type { HouseholdInvite, HouseholdMember } from "../data";
import { invitePath } from "../invite-link";

const DAY = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", timeZone: "America/Bogota" });

interface HouseholdMembersProps {
  members: HouseholdMember[];
  invites: HouseholdInvite[];
  currentUserId: string;
  canInvite: boolean;
  limit: number;
  /** Dominio desde el que se armó la página, para que el enlace sirva tal cual al copiarlo. */
  origin: string;
}

type Pending = { kind: "remove"; member: HouseholdMember } | { kind: "leave" } | null;

function InviteLink({ token, expiresAt, origin }: HouseholdInvite & { origin: string }) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const url = `${origin}${invitePath(token)}`;
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <li className="flex flex-col gap-2 rounded-md border border-dashed border-hairline-strong p-3 sm:flex-row sm:items-center">
      <code className="min-w-0 flex-1 truncate text-sm">{url}</code>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Vence el {DAY.format(new Date(expiresAt))}</span>
        <Button variant="secondary" size="sm" onClick={copy} aria-label="Copiar enlace de invitación">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted hover:text-danger"
          onClick={() => startTransition(async () => void (await revokeInvite(token)))}
        >
          Anular
        </Button>
      </div>
    </li>
  );
}

/** Quién vive en el hogar, el enlace para invitar a alguien más y salir o quitar personas. */
export function HouseholdMembers({
  members,
  invites,
  currentUserId,
  canInvite,
  limit,
  origin,
}: HouseholdMembersProps) {
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState<string>();
  const [busy, startTransition] = useTransition();
  const isOwner = members.some((member) => member.userId === currentUserId && member.role === "owner");
  const full = members.length >= limit;

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const result = await action();
      setPending(null);
      setMessage(result.ok ? undefined : result.error);
    });

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {members.map((member) => {
          const isMe = member.userId === currentUserId;
          return (
            <li key={member.userId} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate">{member.email}</span>
                <span className="text-xs text-muted">
                  {member.role === "owner" ? "Administra el hogar" : "Miembro"}
                  {isMe && " · Tú"}
                </span>
              </span>
              {isMe && members.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted"
                  onClick={() => setPending({ kind: "leave" })}
                >
                  Salir del hogar
                </Button>
              )}
              {!isMe && isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted hover:text-danger"
                  onClick={() => setPending({ kind: "remove", member })}
                >
                  Quitar
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {invites.length > 0 && (
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <InviteLink key={invite.token} {...invite} origin={origin} />
          ))}
        </ul>
      )}

      {canInvite ? (
        <div className="flex flex-col gap-1.5">
          <Button
            variant="secondary"
            className="self-start"
            disabled={full}
            loading={busy && pending === null}
            onClick={() => run(createInvite)}
          >
            Crear enlace de invitación
          </Button>
          <p className="text-sm text-muted">
            {full
              ? `El hogar ya tiene ${limit} personas, el máximo.`
              : "Cada enlace sirve para una persona y vence en 7 días. Quien entra comparte el plan, la semana, el mercado y la despensa."}
          </p>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-hairline-strong px-4 py-3 text-sm text-muted">
          Invitar a otras personas del hogar es de los planes Básico y Pro.
        </p>
      )}
      {message && <FormMessage tone="error">{message}</FormMessage>}

      <ConfirmDialog
        open={pending?.kind === "remove"}
        title={`¿Quitar a ${pending?.kind === "remove" ? pending.member.email : ""}?`}
        description="Deja de ver la semana, el mercado y la despensa de este hogar. Su cuenta sigue y puede armar su propio hogar."
        confirmLabel="Quitar"
        dismissLabel="Volver"
        pending={busy}
        onConfirm={() => pending?.kind === "remove" && run(() => removeMember(pending.member.userId))}
        onClose={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === "leave"}
        title="¿Salir del hogar?"
        description="Los datos se quedan con quienes siguen aquí. Tú vuelves a empezar con un hogar nuevo, en el plan Gratis."
        confirmLabel="Salir del hogar"
        dismissLabel="Volver"
        pending={busy}
        onConfirm={() => run(leaveHousehold)}
        onClose={() => setPending(null)}
      />
    </div>
  );
}
