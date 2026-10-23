import type { ReactNode } from "react";
import { LEGAL_UPDATED_AT, type LegalOwner } from "../owner";

/** Tipografía de lectura larga para los textos legales: títulos numerados y párrafos cómodos. */
export function LegalDocument({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="flex animate-rise flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-hairline pb-8">
        <p className="text-sm text-muted">Vigente desde el {LEGAL_UPDATED_AT}</p>
        <h1 className="font-display text-title font-semibold text-balance md:text-display">{title}</h1>
        <div className="text-[17px] leading-relaxed text-muted">{intro}</div>
      </header>
      <div className="flex flex-col gap-10 text-[15px] leading-relaxed [&_a]:underline [&_a]:decoration-hairline-strong [&_a]:underline-offset-4 [&_a:hover]:decoration-ink [&_li]:pl-1 [&_strong]:font-semibold [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5 [&_ul]:marker:text-muted">
        {children}
      </div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function OwnerCard({ owner }: { owner: LegalOwner }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 rounded-md border border-hairline p-4 text-sm">
      <dt className="text-muted">Responsable</dt>
      <dd>{owner.name} (persona natural)</dd>
      <dt className="text-muted">Cédula</dt>
      <dd className="tabular-nums">{owner.id}</dd>
      <dt className="text-muted">Domicilio</dt>
      <dd>
        {owner.address}, {owner.city}
      </dd>
      <dt className="text-muted">Teléfono</dt>
      <dd className="tabular-nums">{owner.phone}</dd>
      <dt className="text-muted">Correo</dt>
      <dd>
        <a href={`mailto:${owner.email}`} className="underline decoration-hairline-strong underline-offset-4">
          {owner.email}
        </a>
      </dd>
    </dl>
  );
}
