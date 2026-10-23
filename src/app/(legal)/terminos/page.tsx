import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalSection, OwnerCard } from "@/features/legal/components/legal-document";
import { readLegalOwner } from "@/features/legal/owner";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  const owner = readLegalOwner();
  return (
    <LegalDocument
      title="Términos y condiciones"
      intro={
        <p>
          Estas son las reglas para usar Olla, la app para planear las comidas de la casa. Al crear tu cuenta
          las aceptas. Las escribimos para que se entiendan; si algo no queda claro, escríbenos.
        </p>
      }
    >
      <LegalSection title="1. Quién presta el servicio">
        <p>Olla lo presta la persona que aparece abajo. Para cualquier asunto, ese es el contacto.</p>
        <OwnerCard owner={owner} />
      </LegalSection>

      <LegalSection title="2. Qué es Olla">
        <p>
          Olla te ayuda a organizar recetas, el menú de la semana, la lista de mercado, la despensa y el
          presupuesto de tu hogar. Es una herramienta de planeación:
        </p>
        <ul>
          <li>
            <strong>Los precios son estimados.</strong> Los de referencia son aproximados y cambian según la
            tienda y la fecha. Ponles tus precios para que el presupuesto se parezca a lo que pagas.
          </li>
          <li>
            <strong>La nutrición es aproximada.</strong> Calorías, proteína y demás se estiman con tablas de
            referencia y las cantidades de cada receta. No es consejo médico ni nutricional; si tienes una
            condición de salud, consulta a un profesional.
          </li>
          <li>
            <strong>El asistente puede equivocarse.</strong> Propone menús y ajustes con inteligencia
            artificial; nada cambia en tu semana hasta que tú lo aceptas, así que revisa lo que propone.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Tu cuenta">
        <ul>
          <li>Para usar Olla debes tener al menos 18 años.</li>
          <li>
            Registras un correo real y una contraseña que solo tú conozcas. Lo que pase con tu cuenta es tu
            responsabilidad, así que no la compartas.
          </li>
          <li>
            Cada cuenta pertenece a un hogar, y los planes se pagan por hogar. En Básico y Pro puedes invitar
            hasta 5 personas más: todas ven y editan la semana, el mercado, la despensa, las recetas y las
            notas del hogar, y comparten su plan.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Planes y pagos">
        <ul>
          <li>
            <strong>Gratis:</strong> recetas, semana, mercado, despensa y presupuesto, sin límite y sin
            tarjeta, más una propuesta de menú del asistente por semana (se renueva cada lunes).
          </li>
          <li>
            <strong>Básico y Pro:</strong> suman el asistente completo, con un número de consultas al día, y
            la nutrición. Lo que incluye cada plan y su precio están en la página de{" "}
            <Link href="/planes">planes</Link>. Ese precio, en pesos colombianos, es el total que pagas.
          </li>
          <li>
            Se paga por adelantado, por un mes (30 días) o un trimestre (90 días), en Wompi, la pasarela de
            pagos de Bancolombia. Olla no ve ni guarda los datos de tu tarjeta o tu cuenta.
          </li>
          <li>
            El plan se activa cuando Wompi aprueba el pago. <strong>No se renueva ni se cobra solo:</strong>{" "}
            te avisamos antes de que venza y, si no lo renuevas, tu hogar vuelve al plan Gratis sin perder
            nada de lo que guardaste.
          </li>
          <li>
            Si cambiamos los precios, el cambio aplica desde el siguiente pago; lo que ya pagaste se respeta.
          </li>
          <li>
            <strong>Prueba gratis:</strong> cada hogar puede probar Pro una vez, por 7 días, sin pagar ni dar
            datos de pago. Al terminar vuelve al plan Gratis.
          </li>
          <li>
            Para devoluciones aplica la <Link href="/reembolsos">política de reembolsos</Link>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. El asistente">
        <p>
          Las consultas al día de cada plan se reinician a la medianoche, hora de Colombia. Para que el
          servicio funcione bien para todos, cada consulta tiene un tamaño máximo (por ejemplo, el largo de
          una instrucción o de una receta pegada). El asistente usa un proveedor externo de inteligencia
          artificial; si ese proveedor falla, puede no estar disponible por un rato. Cuando una consulta no se
          puede responder, no se descuenta de tu cupo.
        </p>
      </LegalSection>

      <LegalSection title="6. Lo que guardas en Olla">
        <p>
          Tus recetas, notas, precios y demás datos son tuyos. Nos das permiso de guardarlos y procesarlos
          solo para prestarte el servicio, como explica la{" "}
          <Link href="/privacidad">política de privacidad</Link>. Si pegas o subes recetas de otras personas,
          asegúrate de tener derecho a usarlas.
        </p>
      </LegalSection>

      <LegalSection title="7. Usos no permitidos">
        <ul>
          <li>Acceder a Olla con programas automáticos o intentar saltarte los límites de los planes.</li>
          <li>
            Intentar entrar a cuentas o datos de otras personas, o afectar el funcionamiento del servicio.
          </li>
          <li>Copiar, revender o descompilar el software, la marca o el diseño de Olla.</li>
          <li>Usar el asistente para algo distinto a planear comidas.</li>
        </ul>
        <p>
          Si alguno de estos usos ocurre, podemos suspender la cuenta. Antes te escribimos al correo
          registrado, salvo que el daño exija actuar de inmediato.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilidad y responsabilidad">
        <p>
          Trabajamos para que Olla funcione siempre, pero puede haber interrupciones por mantenimiento o por
          fallas de los proveedores que usamos. Olla no responde por decisiones de compra, de cocina o de
          alimentación tomadas solo con base en sus estimados. Nada de esto limita los derechos que te da la
          ley como consumidor, en especial el Estatuto del Consumidor (Ley 1480 de 2011).
        </p>
      </LegalSection>

      <LegalSection title="9. Dejar de usar Olla">
        <p>
          Puedes dejar de usar Olla cuando quieras. Tu plan lo cancelas en Planes y tu cuenta la eliminas en
          Ajustes; al eliminarla se borran de inmediato tu hogar y sus datos. También puedes pedirlo a{" "}
          <a href={`mailto:${owner.email}`}>{owner.email}</a>. Solo conservamos los registros de pago que la
          ley contable y tributaria nos obliga a guardar.
        </p>
      </LegalSection>

      <LegalSection title="10. Peticiones, quejas y reclamos">
        <p>
          Escríbenos a <a href={`mailto:${owner.email}`}>{owner.email}</a> con tu correo de registro y lo que
          necesitas. Respondemos en un máximo de 15 días hábiles. Si no quedas conforme, puedes acudir a la
          Superintendencia de Industria y Comercio.
        </p>
      </LegalSection>

      <LegalSection title="11. Cambios a estos términos">
        <p>
          Si cambiamos estos términos, publicamos la nueva versión aquí con su fecha y te avisamos en la app
          antes de que empiece a regir. Si no estás de acuerdo, puedes dejar de usar Olla y pedir que borremos
          tus datos.
        </p>
      </LegalSection>

      <LegalSection title="12. Ley aplicable">
        <p>
          Estos términos se rigen por las leyes de Colombia. Cualquier diferencia se resuelve ante las
          autoridades competentes de Medellín, sin perjuicio de tu derecho a acudir a la Superintendencia de
          Industria y Comercio o al juez de tu domicilio.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
