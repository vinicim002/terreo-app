import type { MetadataRoute } from "next"

// Manifesto do PWA, conforme o LEIA-ME do kit da marca (RF-021, RF-022).
export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Térreo",
    short_name: "Térreo",
    description:
      "O app do condomínio: avisos, entregas, visitantes e tudo o que acontece no prédio.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#E8590C",
    theme_color: "#E8590C",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
