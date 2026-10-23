import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/features/legal/components/legal-document";
import { readLegalOwner } from "@/features/legal/owner";

export const metadata: Metadata = { title: "Política de reembolsos" };

export default function RefundsPage() {
  const owner = readLegalOwner();
  const mail = <a href={`mailto:${owner.email}`}>{owner.email}</a>;
  return (
    <LegalDocument
      title="Política de reembolsos"
      intro={
        <p>
          Cuándo te devolvemos el dinero de un plan y cómo pedirlo. Los planes se pagan por adelantado y no se
          renuevan solos, así que nunca te cobramos algo que no pagaste tú.
        </p>
      }
    >
      <LegalSection title="1. Retracto: 5 días hábiles">
        <p>
          Si te arrepientes, te devolvemos <strong>todo</strong> lo que pagaste por un plan si lo pides dentro
          de los <strong>5 días hábiles</strong> siguientes al pago, sin preguntas. Es el derecho de retracto
          del Estatuto del Consumidor (Ley 1480 de 2011, artículo 47), y lo aplicamos aunque ya hayas empezado
          a usar el plan.
        </p>
        <p>Al devolverte el dinero, tu hogar vuelve al plan Gratis y conservas todo lo que guardaste.</p>
      </LegalSection>

      <LegalSection title="2. Después de esos 5 días">
        <p>
          No hay reembolso, ni total ni proporcional. El plan sigue activo hasta su fecha de vencimiento, que
          ves en la página de planes, y después tu hogar vuelve al plan Gratis. Como el plan no se renueva
          solo, no hay nada que cancelar.
        </p>
      </LegalSection>

      <LegalSection title="3. Errores en el cobro">
        <p>
          Si te cobramos dos veces el mismo plan, o un valor distinto del que aceptaste, te devolvemos la
          diferencia en cualquier momento.
        </p>
      </LegalSection>

      <LegalSection title="4. La prueba gratis">
        <p>
          Los 7 días de Pro no cuestan nada ni piden datos de pago, así que no hay nada que devolver. Al
          terminar, el hogar vuelve al plan Gratis sin cobros.
        </p>
      </LegalSection>

      <LegalSection title="5. Cómo pedirlo">
        <p>Escribe a {mail} con:</p>
        <ul>
          <li>El correo de tu cuenta en Olla.</li>
          <li>La referencia del pago o la fecha y el valor.</li>
          <li>
            Si pagaste por PSE, Nequi o botón Bancolombia: el banco, el tipo y el número de la cuenta donde
            quieres recibir el dinero, a tu nombre.
          </li>
        </ul>
        <p>
          Te confirmamos que recibimos la solicitud y te devolvemos el dinero en máximo{" "}
          <strong>30 días calendario</strong>. Si pagaste con tarjeta, la devolución se hace a la misma
          tarjeta; según tu banco, puede tardar unos días más en verse en el extracto.
        </p>
      </LegalSection>

      <LegalSection title="6. Reversión del pago">
        <p>
          Si el pago lo hizo alguien sin tu permiso, o si pagaste y el plan no se activó, además puedes pedir
          la reversión del pago (Ley 1480, artículo 51, y Decreto 587 de 2016). Escríbenos a {mail} en los 5
          días hábiles siguientes a que te enteres, y avísale también a tu banco o a la entidad con la que
          pagaste.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
