import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";
import { getCurrentHousehold, requireUser } from "@/features/household/data";
import { JoinInvite } from "@/features/members/components/join-invite";
import { previewInvite } from "@/features/members/data";
import { inviteTokenSchema } from "@/features/members/invite-link";
import { buttonClasses } from "@/ui/button";
import { HOME_PATH } from "@/lib/routes";

export const metadata: Metadata = { title: "Unirme a un hogar" };

async function Invitation({ searchParams }: Pick<PageProps<"/unirme">, "searchParams">) {
  const [{ codigo }, user] = await Promise.all([searchParams, requireUser()]);
  const token = inviteTokenSchema.safeParse(codigo);
  const [invite, current] = await Promise.all([
    token.success ? previewInvite(token.data) : null,
    getCurrentHousehold(),
  ]);

  if (!invite || !token.success) {
    return (
      <>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-title font-semibold">Este enlace ya no sirve</h1>
          <p className="text-muted">
            Venció o ya se usó. Pídele a quien te invitó que cree uno nuevo desde Ajustes.
          </p>
        </div>
        <Link href={current ? HOME_PATH : "/empezar"} className={buttonClasses({ variant: "secondary" })}>
          {current ? "Ir a mi semana" : "Crear mi propio hogar"}
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="letrero text-sm text-muted">Invitación</p>
        <h1 className="font-display text-title font-semibold text-balance">
          Te invitaron a {invite.householdName}
        </h1>
        <p className="text-muted">
          {invite.members === 1 ? "Ya hay 1 persona" : `Ya hay ${invite.members} personas`}. Al unirte
          compartes la semana, el mercado, la despensa y el plan del hogar. Entras como {user.email}.
        </p>
      </div>
      {current && (
        <p className="rounded-md border border-maiz bg-maiz/10 px-4 py-3 text-sm">
          Sales de <span className="font-medium">{current.name}</span>. Si eres la única persona ahí, ese
          hogar y sus datos (recetas, semanas, despensa y notas) se borran.
        </p>
      )}
      <JoinInvite token={token.data} householdName={invite.householdName} />
    </>
  );
}

export default function JoinPage({ searchParams }: PageProps<"/unirme">) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <Invitation searchParams={searchParams} />
    </Suspense>
  );
}
