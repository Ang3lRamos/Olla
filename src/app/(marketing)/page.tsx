import type { Metadata } from "next";
import { listPublicPlanPrices } from "@/features/billing/data";
import { LandingClosing, LandingFaq, LandingFooter } from "@/features/marketing/components/landing-faq";
import { LandingHeader, LandingHero } from "@/features/marketing/components/landing-hero";
import { LandingPricing } from "@/features/marketing/components/landing-pricing";
import { FeatureRows, HowItWorks } from "@/features/marketing/components/landing-sections";

export const metadata: Metadata = {
  title: { absolute: "Olla · El menú de la semana y el mercado, en pesos" },
  description:
    "Planea las comidas de la casa, arma el mercado sin repetir lo que ya tienes y sabe cuánto vas a gastar. Gratis y sin tarjeta.",
  openGraph: {
    title: "Olla · El menú de la semana y el mercado, en pesos",
    description:
      "Planea las comidas de la casa, arma el mercado y cuida el presupuesto. Gratis y sin tarjeta.",
    locale: "es_CO",
    type: "website",
  },
};

/** Página pública: quien ya tiene sesión no la ve, el proxy lo lleva directo a su semana. */
export default async function LandingPage() {
  const prices = await listPublicPlanPrices();
  return (
    <div className="flex min-h-full flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <HowItWorks />
        <FeatureRows />
        <LandingPricing prices={prices} />
        <LandingFaq />
        <LandingClosing />
      </main>
      <LandingFooter />
    </div>
  );
}
