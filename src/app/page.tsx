import { redirect } from "next/navigation";

// Mientras no exista la vista de la semana (fase 5), el inicio lleva a las recetas.
export default function Home() {
  redirect("/recetas");
}
