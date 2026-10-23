import type { Metadata } from "next";
import { LegalDocument, LegalSection, OwnerCard } from "@/features/legal/components/legal-document";
import { readLegalOwner } from "@/features/legal/owner";

export const metadata: Metadata = { title: "Política de privacidad" };

const PROVIDERS = [
  {
    name: "Supabase",
    role: "Base de datos, cuentas y correos de acceso",
    where: "Estados Unidos",
  },
  { name: "Vercel", role: "Servidores donde corre la app", where: "Estados Unidos" },
  {
    name: "Groq",
    role: "Inteligencia artificial del asistente y de “Pegar receta”",
    where: "Estados Unidos",
  },
  { name: "Wompi (Bancolombia)", role: "Cobro de los planes", where: "Colombia" },
];

export default function PrivacyPage() {
  const owner = readLegalOwner();
  const mail = <a href={`mailto:${owner.email}`}>{owner.email}</a>;
  return (
    <LegalDocument
      title="Política de privacidad y tratamiento de datos"
      intro={
        <p>
          Qué datos guarda Olla, para qué y cómo ejerces tus derechos sobre ellos, conforme a la Ley 1581 de
          2012 y el Decreto 1074 de 2015.
        </p>
      }
    >
      <LegalSection title="1. Responsable del tratamiento">
        <OwnerCard owner={owner} />
      </LegalSection>

      <LegalSection title="2. Qué datos tratamos">
        <ul>
          <li>
            <strong>De tu cuenta:</strong> tu correo y tu contraseña, que se guarda cifrada y nadie puede
            leer.
          </li>
          <li>
            <strong>De tu hogar:</strong> nombre del hogar, número de personas, presupuesto, lo que no quieren
            comer, recetas, menús, despensa, lista de mercado, precios y notas.
          </li>
          <li>
            <strong>Metas de nutrición:</strong> son opcionales. Pueden dar pistas sobre tu salud, que la ley
            considera un dato sensible, así que no estás obligado a darlas; si las das, solo tú las ves.
          </li>
          <li>
            <strong>De tus pagos:</strong> el plan, el valor, la fecha, el estado y la referencia del pago.
            Los datos de tu tarjeta o cuenta bancaria los recibe Wompi; Olla no los ve ni los guarda.
          </li>
          <li>
            <strong>Técnicos:</strong> registros de errores y de uso del asistente (cuántas consultas hiciste
            cada día), para que el servicio funcione y para aplicar los límites de cada plan.
          </li>
        </ul>
        <p>No pedimos tu nombre, tu cédula, tu dirección ni tu teléfono.</p>
      </LegalSection>

      <LegalSection title="3. Para qué los usamos">
        <ul>
          <li>Prestarte el servicio: guardar tu semana, armar el mercado y calcular costos y nutrición.</li>
          <li>Hacer funcionar el asistente cuando se lo pides.</li>
          <li>Activar y renovar tus planes, y llevar la contabilidad que exige la ley.</li>
          <li>
            Escribirte sobre tu cuenta: confirmar el correo, recuperar la contraseña o responder lo que pidas.
          </li>
          <li>Corregir errores y mantener la seguridad del servicio.</li>
        </ul>
        <p>
          No vendemos tus datos, no los usamos para publicidad y no los compartimos con nadie distinto de los
          proveedores de la sección 4.
        </p>
      </LegalSection>

      <LegalSection title="4. Con quién los compartimos">
        <p>
          Para prestar el servicio usamos estos proveedores, que tratan los datos por cuenta nuestra (son
          encargados del tratamiento) y solo para lo que se indica. Varios están fuera de Colombia, así que al
          aceptar esta política autorizas esa transmisión internacional.
        </p>
        <div className="overflow-x-auto rounded-md border border-hairline">
          <table className="w-full text-left text-sm">
            <thead className="bg-sunken/60 text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Proveedor</th>
                <th className="px-4 py-2 font-medium">Para qué</th>
                <th className="px-4 py-2 font-medium">Dónde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {PROVIDERS.map((provider) => (
                <tr key={provider.name}>
                  <td className="px-4 py-2 font-medium">{provider.name}</td>
                  <td className="px-4 py-2">{provider.role}</td>
                  <td className="px-4 py-2">{provider.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Al asistente solo le enviamos lo necesario para cada consulta (recetas, despensa, preferencias,
          presupuesto, notas de la semana o el texto que pegas), nunca tu correo. Las autoridades pueden
          pedirnos datos; solo los entregamos cuando la ley nos obliga.
        </p>
      </LegalSection>

      <LegalSection title="5. Tus derechos">
        <p>Como titular de tus datos puedes:</p>
        <ul>
          <li>Conocer, actualizar y corregir tus datos.</li>
          <li>Pedir prueba de la autorización que nos diste.</li>
          <li>Saber cómo hemos usado tus datos.</li>
          <li>
            Revocar la autorización o pedir que borremos tus datos, salvo los que la ley nos obliga a
            conservar.
          </li>
          <li>Acceder gratis a tus datos.</li>
          <li>
            Presentar quejas ante la Superintendencia de Industria y Comercio, después de haber hecho tu
            consulta o reclamo ante nosotros.
          </li>
        </ul>
        <p>
          Casi todo lo puedes hacer tú mismo dentro de Olla: editar o borrar recetas, productos, notas y
          metas, y cambiar los datos del hogar en Ajustes.
        </p>
      </LegalSection>

      <LegalSection title="6. Cómo hacer una consulta o un reclamo">
        <p>Escribe a {mail} desde el correo de tu cuenta, o di cuál es, y cuéntanos qué necesitas.</p>
        <ul>
          <li>
            <strong>Consultas</strong> (saber qué datos tenemos y cómo los usamos): respondemos en máximo 10
            días hábiles. Si no alcanzamos, te avisamos el motivo y respondemos en máximo 5 días hábiles más.
          </li>
          <li>
            <strong>Reclamos</strong> (corregir, actualizar o borrar datos, o revocar la autorización):
            respondemos en máximo 15 días hábiles, prorrogables por 8 días hábiles más avisándote el motivo.
            Si al reclamo le falta información, te la pedimos en los 5 días siguientes; si pasan dos meses sin
            que la envíes, entendemos que desististe.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Cuánto tiempo los guardamos">
        <p>
          Mientras tengas tu cuenta. Si la eliminas desde Ajustes, tus datos se borran en ese momento; si nos
          lo pides por correo, en máximo 15 días hábiles. Solo conservamos los registros de pago por el tiempo
          que exige la ley contable y tributaria.
        </p>
      </LegalSection>

      <LegalSection title="8. Seguridad">
        <p>
          Las conexiones van cifradas, las contraseñas se guardan cifradas y la base de datos solo deja que
          cada hogar vea lo suyo. Ningún sistema es infalible: si llegara a haber un incidente que afecte tus
          datos, te avisamos y lo reportamos a la Superintendencia de Industria y Comercio.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies y almacenamiento del navegador">
        <p>
          Usamos solo lo necesario para que la app funcione: cookies que mantienen tu sesión abierta y, en tu
          navegador, preferencias como el tema claro u oscuro o si ya viste el recorrido. No usamos cookies de
          publicidad ni de analítica de terceros.
        </p>
      </LegalSection>

      <LegalSection title="10. Menores de edad">
        <p>Olla es para mayores de 18 años. No recogemos a sabiendas datos de menores.</p>
      </LegalSection>

      <LegalSection title="11. Cambios a esta política">
        <p>
          Si la cambiamos de forma importante, te avisamos en la app antes de que rija y, si hace falta, te
          pedimos de nuevo la autorización. La versión vigente es siempre la de esta página.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
