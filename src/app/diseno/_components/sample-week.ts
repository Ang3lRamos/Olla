// Datos de ejemplo solo para la página de dirección visual; no son datos reales.

export const MEALS = ["Desayuno", "Almuerzo", "Comida"] as const;

export interface SampleSlot {
  recipe: string | null;
  note?: string;
}

export interface SampleDay {
  short: string;
  long: string;
  date: number;
  isToday: boolean;
  costCop: number;
  slots: [SampleSlot, SampleSlot, SampleSlot];
}

export const SAMPLE_WEEK: SampleDay[] = [
  {
    short: "Lun",
    long: "Lunes",
    date: 19,
    isToday: false,
    costCop: 24800,
    slots: [
      { recipe: "Calentado con huevo" },
      { recipe: "Sudado de pollo con arroz" },
      { recipe: "Arepa con queso" },
    ],
  },
  {
    short: "Mar",
    long: "Martes",
    date: 20,
    isToday: false,
    costCop: 21300,
    slots: [
      { recipe: "Huevos pericos" },
      { recipe: "Fríjoles con arroz y maduro" },
      { recipe: "Sopa de verduras" },
    ],
  },
  {
    short: "Mié",
    long: "Miércoles",
    date: 21,
    isToday: true,
    costCop: 18900,
    slots: [
      { recipe: "Changua" },
      { recipe: "Lentejas con arroz", note: "Sobró arroz del lunes" },
      { recipe: "Arepa rellena" },
    ],
  },
  {
    short: "Jue",
    long: "Jueves",
    date: 22,
    isToday: false,
    costCop: 29600,
    slots: [{ recipe: "Calentado" }, { recipe: "Ajiaco" }, { recipe: "Tortilla de papa" }],
  },
  {
    short: "Vie",
    long: "Viernes",
    date: 23,
    isToday: false,
    costCop: 33100,
    slots: [
      { recipe: "Huevos pericos" },
      { recipe: "Pescado frito con patacón", note: "A los niños no les gustó" },
      { recipe: "Sopa de pasta" },
    ],
  },
  {
    short: "Sáb",
    long: "Sábado",
    date: 24,
    isToday: false,
    costCop: 31200,
    slots: [{ recipe: "Tamal" }, { recipe: "Arroz con pollo" }, { recipe: "Empanadas" }],
  },
  {
    short: "Dom",
    long: "Domingo",
    date: 25,
    isToday: false,
    costCop: 27500,
    slots: [{ recipe: "Chocolate con pan" }, { recipe: "Sancocho de gallina" }, { recipe: null }],
  },
];
