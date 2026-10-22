import { redirect } from "next/navigation";

// Mientras no exista la vista de la semana (fase 5), el inicio lleva a los ajustes del hogar.
export default function Home() {
  redirect("/ajustes");
}
