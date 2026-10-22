// Datos de ejemplo solo para la página de dirección visual; no son datos reales.

export const MEALS = ["Desayuno", "Almuerzo", "Comida"] as const;
export const PEOPLE = 4;
export const WEEKLY_BUDGET_COP = 200000;

export interface SampleSlot {
  recipe: string;
  category: string;
  minutes: number;
  costCop: number;
  usesPantry?: boolean;
  note?: string;
}

export interface SampleDay {
  short: string;
  long: string;
  date: number;
  isToday: boolean;
  slots: [SampleSlot | null, SampleSlot | null, SampleSlot | null];
}

const slot = (
  recipe: string,
  category: string,
  minutes: number,
  costCop: number,
  extra?: Partial<SampleSlot>,
) => ({
  recipe,
  category,
  minutes,
  costCop,
  ...extra,
});

export const SAMPLE_WEEK: SampleDay[] = [
  {
    short: "Lun",
    long: "Lunes",
    date: 19,
    isToday: false,
    slots: [
      slot("Calentado con huevo", "Desayuno", 15, 6200, { usesPantry: true }),
      slot("Sudado de pollo con arroz", "Plato fuerte", 50, 14800),
      slot("Arepa con queso", "Ligero", 15, 4800),
    ],
  },
  {
    short: "Mar",
    long: "Martes",
    date: 20,
    isToday: false,
    slots: [
      slot("Huevos pericos", "Desayuno", 10, 4300),
      slot("Fríjoles con arroz y maduro", "Plato fuerte", 90, 11900, { usesPantry: true }),
      slot("Sopa de verduras", "Sopa", 35, 5100),
    ],
  },
  {
    short: "Mié",
    long: "Miércoles",
    date: 21,
    isToday: true,
    slots: [
      slot("Changua", "Desayuno", 15, 3900),
      slot("Lentejas con arroz", "Plato fuerte", 45, 9800, {
        note: "Sobró arroz del lunes",
        usesPantry: true,
      }),
      slot("Arepa rellena", "Ligero", 20, 5200),
    ],
  },
  {
    short: "Jue",
    long: "Jueves",
    date: 22,
    isToday: false,
    slots: [
      slot("Calentado", "Desayuno", 15, 5400, { usesPantry: true }),
      slot("Ajiaco", "Sopa", 75, 17600),
      slot("Tortilla de papa", "Ligero", 25, 6600),
    ],
  },
  {
    short: "Vie",
    long: "Viernes",
    date: 23,
    isToday: false,
    slots: [
      slot("Huevos pericos", "Desayuno", 10, 4300),
      slot("Pescado frito con patacón", "Plato fuerte", 40, 22400, { note: "A los niños no les gustó" }),
      slot("Sopa de pasta", "Sopa", 30, 6400),
    ],
  },
  {
    short: "Sáb",
    long: "Sábado",
    date: 24,
    isToday: false,
    slots: [
      slot("Tamal", "Desayuno", 5, 12000),
      slot("Arroz con pollo", "Plato fuerte", 60, 13800),
      slot("Empanadas", "Ligero", 45, 5400),
    ],
  },
  {
    short: "Dom",
    long: "Domingo",
    date: 25,
    isToday: false,
    slots: [
      slot("Chocolate con pan", "Desayuno", 10, 5300),
      slot("Sancocho de gallina", "Sopa", 120, 22200),
      null,
    ],
  },
];

export const dayCost = (day: SampleDay) => day.slots.reduce((sum, item) => sum + (item?.costCop ?? 0), 0);
