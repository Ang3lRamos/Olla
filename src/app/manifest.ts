import type { MetadataRoute } from "next";

/** Para instalar Olla en el celular: abre directo en la semana, sin la barra del navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Olla",
    short_name: "Olla",
    description: "El menú de la semana, el mercado y el presupuesto de la casa.",
    lang: "es-CO",
    start_url: "/semana",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
