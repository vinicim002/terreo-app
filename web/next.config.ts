import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV === "development"

// research R1: a exportação estática só fica ligada no build. No `next dev` ela
// ficaria incompatível com o repasse de /api e com as rotas do painel /dev.
// research R7: o painel (*.dev.tsx / *.dev.ts) só existe no desenvolvimento.
const nextConfig: NextConfig = {
  output: isDev ? undefined : "export",
  trailingSlash: true,
  skipTrailingSlashRedirect: isDev,
  images: { unoptimized: true },
  // "web" é o nome do contêiner usado pelos testes e2e; DEV_ALLOWED_ORIGINS aceita, por exemplo,
  // o IP da máquina na rede para abrir o app de desenvolvimento no celular.
  allowedDevOrigins: [
    "web",
    ...(process.env.DEV_ALLOWED_ORIGINS?.split(",").filter(Boolean) ?? []),
  ],
  pageExtensions: isDev
    ? ["tsx", "ts", "jsx", "js", "dev.tsx", "dev.ts"]
    : ["tsx", "ts", "jsx", "js"],
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID ?? new Date().toISOString(),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(isDev && {
    async rewrites() {
      const api = process.env.API_INTERNAL_URL ?? "http://localhost:8100"
      return [{ source: "/api/:path*", destination: `${api}/api/:path*` }]
    },
  }),
}

export default nextConfig
