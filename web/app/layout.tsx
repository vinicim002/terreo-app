import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { NO_FLASH_SCRIPT } from "@/preferences/no-flash-script"
import { VLibras } from "@/components/accessibility/VLibras"
import { DemoBadge } from "@/components/layout/DemoBadge"
import { OfflineBanner } from "@/components/layout/OfflineBanner"
import { StorageWarning } from "@/preferences/StorageWarning"
import { RegisterServiceWorker } from "@/pwa/RegisterServiceWorker"
import { AppProviders } from "@/providers/AppProviders"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] })

export const metadata: Metadata = {
  title: { default: "Térreo", template: "%s · Térreo" },
  description: "O app do condomínio: avisos, entregas, visitantes e tudo o que acontece no prédio.",
  applicationName: "Térreo",
  appleWebApp: { capable: true, title: "Térreo", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  // Identificador do build, usado para conferir a troca de versão (RF-023a).
  other: { "terreo-build": process.env.NEXT_PUBLIC_BUILD_ID ?? "" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#E8590C",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme, data-contrast, data-font e lang são definidos pelo script antes da primeira pintura.
    // Sem eles (antes do script ou sem JavaScript), o CSS cai no tema claro e na letra padrão.
    <html lang="pt-BR" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <AppProviders>
          <DemoBadge />
          <OfflineBanner />
          <StorageWarning />
          {children}
          <VLibras />
          <RegisterServiceWorker />
        </AppProviders>
      </body>
    </html>
  )
}
