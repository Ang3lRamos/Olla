export interface HelpSection {
  title: string;
  intro: string;
  tips: string[];
}

/** Ayuda de cada pantalla, en el orden en que se usa Olla en una semana. */
export const HELP_BY_SECTION: Record<string, HelpSection> = {
  "/semana": {
    title: "La semana",
    intro: "Aquí decides qué se come cada día: desayuno, almuerzo y comida.",
    tips: [
      "Toca una casilla para elegir una receta. Si vienen visitas, cambia las personas de esa comida.",
      "«Armar el menú» llena la semana con lo que tienes, con el asistente o mezclando los dos; tú decides qué se aplica.",
      "Lo que dices tener en casa queda en la despensa; lo que ibas a mercar y ninguna receta usa puede ir al mercado.",
      "Cuando cocines, abre la comida y toca «Ya la cocinamos»: lo usado se descuenta de la despensa.",
      "Las notas («sobró arroz», «no les gustó») ayudan al asistente a proponer mejor.",
    ],
  },
  "/mercado": {
    title: "El mercado",
    intro: "La lista sale sola del menú de la semana.",
    tips: [
      "Suma lo que se repite y resta lo que ya tienes en la despensa.",
      "Si pusiste tu presentación en Presupuesto, pide paquetes enteros y lo que sobre queda en casa.",
      "Marca lo que vas comprando: entra a la despensa. «Copiar lista» la deja lista para WhatsApp.",
      "¿Algo que no está en las recetas? Agrégalo abajo (detergente, papel…).",
    ],
  },
  "/recetas": {
    title: "Las recetas",
    intro: "Recetas colombianas de base y las tuyas, con su costo según tus precios.",
    tips: [
      "Busca por nombre o por ingrediente, sin preocuparte por las tildes.",
      "En una receta cambia las porciones y las cantidades se ajustan solas.",
      "«Duplicar para editar» crea tu versión sin tocar la original.",
      "En Ajustes eliges si ves cantidades sencillas o cada gramo exacto.",
    ],
  },
  "/despensa": {
    title: "La despensa",
    intro: "Lo que ya tienes en casa, para no comprar de más.",
    tips: [
      "Las cantidades pueden ser aproximadas.",
      "Lo que marcas como comprado en el mercado entra aquí solo.",
      "Al tocar «Ya la cocinamos» en una comida, se descuenta lo que usó.",
    ],
  },
  "/notas": {
    title: "Las notas",
    intro: "Lo que pasó en cada comida, en orden.",
    tips: [
      "Escríbelas desde la semana, en cada comida o en el día.",
      "El asistente las lee para aprovechar sobrantes y evitar lo que no gustó.",
    ],
  },
  "/presupuesto": {
    title: "El presupuesto",
    intro: "Cuánto vale tu semana con tus propios precios.",
    tips: [
      "Los precios vienen como referencia: pon lo que pagas tú y lo que trae el paquete (p. ej. 450 g, 18 tajadas).",
      "Con tu presentación, el mercado se cuenta en paquetes enteros.",
      "El gráfico muestra qué días salen más caros.",
    ],
  },
  "/planes": {
    title: "Los planes",
    intro: "Todo Olla es gratis, con un menú del asistente por semana; los planes suman más.",
    tips: [
      "Pagas en Wompi con tarjeta, PSE, Nequi o Bancolombia.",
      "El plan no se renueva solo: te avisamos antes de que venza.",
    ],
  },
};

export const GENERAL_HELP: HelpSection = {
  title: "Cómo usar Olla",
  intro: "Planea la semana, el mercado sale solo y sabes cuánto vas a gastar.",
  tips: [
    "1. Llena la semana (o pídeselo al asistente).",
    "2. Revisa el mercado y marca lo que compras.",
    "3. Cocina y toca «Ya la cocinamos» para llevar la despensa al día.",
  ],
};

/** La ayuda de la sección actual; /recetas/… usa la de recetas. */
export function helpFor(pathname: string): HelpSection {
  const section = Object.keys(HELP_BY_SECTION).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  return section ? HELP_BY_SECTION[section]! : GENERAL_HELP;
}
