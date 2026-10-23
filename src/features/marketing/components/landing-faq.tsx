import Link from "next/link";
import { buttonClasses } from "@/ui/button";

const QUESTIONS = [
  {
    question: "¿Necesito tarjeta para empezar?",
    answer:
      "No. El plan Gratis no pide datos de pago, y la prueba de 7 días de Pro tampoco. Solo pagas si decides tener el asistente.",
  },
  {
    question: "¿Se cobra solo cada mes?",
    answer:
      "No. Pagas un mes o un trimestre por adelantado y te avisamos antes de que venza. Si no renuevas, vuelves al plan Gratis sin perder nada.",
  },
  {
    question: "¿Los precios son los de mi tienda?",
    answer:
      "Olla trae precios de referencia para empezar, marcados como tales. Pon los tuyos y el presupuesto se parecerá a lo que pagas.",
  },
  {
    question: "¿Puedo usar mis propias recetas?",
    answer:
      "Sí. Las escribes en un formulario o pegas el texto de una receta y el asistente la convierte, con sus ingredientes y pasos.",
  },
  {
    question: "¿Y si me arrepiento de pagar?",
    answer:
      "Dentro de los 5 días hábiles después del pago te devolvemos todo. Lo pides en la app y soporte te escribe para coordinarlo.",
  },
];

export function LandingFaq() {
  return (
    <section id="preguntas" className="scroll-mt-20 border-t border-hairline bg-sunken/50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:px-8 md:py-28">
        <div className="flex flex-col gap-3">
          <p className="letrero text-sm text-muted">Preguntas</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Lo que suelen preguntar</h2>
        </div>
        <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {QUESTIONS.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.question}
                <span
                  aria-hidden
                  className="text-xl leading-none text-muted transition-transform duration-(--dur-base) ease-out group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-2xl leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingClosing() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 md:px-8 md:py-28">
      <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">
        Esta semana, sal a mercar sabiendo cuánto vas a gastar.
      </h2>
      <Link href="/registro" className={buttonClasses({ className: "h-12 px-6 text-base" })}>
        Crear cuenta gratis
      </Link>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:px-8">
        <span>Hecho en Colombia · Precios en pesos colombianos</span>
        <nav aria-label="Documentos legales" className="flex gap-5">
          <Link href="/terminos" className="hover:text-ink">
            Términos
          </Link>
          <Link href="/privacidad" className="hover:text-ink">
            Privacidad
          </Link>
          <Link href="/reembolsos" className="hover:text-ink">
            Reembolsos
          </Link>
        </nav>
      </div>
    </footer>
  );
}
