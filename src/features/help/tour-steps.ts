export interface TourStep {
  /** Valor de data-tour del elemento que se resalta; se usa el primero visible. */
  target: string;
  title: string;
  body: string;
}

/** El recorrido de la primera vez: lo mínimo para usar Olla en una semana real. */
export const TOUR_STEPS: TourStep[] = [
  {
    target: "week-days",
    title: "Tu semana",
    body: "Toca una casilla para elegir qué se come ese día. Puedes cambiar las personas de cada comida y dejar notas.",
  },
  {
    target: "assistant",
    title: "El asistente",
    body: "Pídele que proponga la semana o que la ajuste con tus palabras: «estoy corto de plata», «más sopas». Tú decides qué se aplica.",
  },
  {
    target: "nav-mercado",
    title: "El mercado sale solo",
    body: "Suma lo que se repite en el menú y resta lo que ya hay en casa. Marca lo que vas comprando y compártelo por WhatsApp.",
  },
  {
    target: "nav-despensa",
    title: "Despensa y cocina",
    body: "Lo que compras entra a la despensa. Cuando cocines, toca «Ya la cocinamos» en la comida y se descuenta lo usado.",
  },
  {
    target: "week-summary",
    title: "Lo que vas a gastar",
    body: "Aquí ves el mercado de la semana en pesos. En Presupuesto pones lo que pagas tú y el paquete que compras.",
  },
];

/** Si la persona ya vio (o saltó) el recorrido, en este navegador. */
export const TOUR_SEEN_KEY = "olla-recorrido-visto";
/** Volver a verlo desde la ayuda: /semana?recorrido=1 */
export const TOUR_QUERY = "recorrido";
