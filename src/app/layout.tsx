import type { Metadata, Viewport } from "next"
import { Noto_Sans_SC } from "next/font/google"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"
import { Providers } from "./providers"
import { VercelAnalytics } from "@/components/Analytics"
import { PwaInstaller } from "@/components/PwaInstaller"
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister"
import { SeoJsonLd } from "@/components/SeoJsonLd"

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-sc",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4CAF50",
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://kidstep.app"),
  title: "童行 - 每一步，都陪你走",
  description: "帮助幼儿园大班家长科学开展幼小衔接的教练工具",
  keywords: ["幼小衔接", "幼升小", "入学准备", "家庭教育", "能力评估", "训练计划"],
  manifest: "/manifest.json",
  icons: {
    icon: "/images/brand/app-icon.png",
    apple: "/images/brand/app-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "童行 - 每一步，都陪你走",
    description: "帮助幼儿园大班家长科学开展幼小衔接的教练工具",
    images: ["/images/brand/logo-horizontal.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "童行 - 每一步，都陪你走",
    description: "帮助幼儿园大班家长科学开展幼小衔接的教练工具",
    images: ["/images/brand/logo-horizontal.jpg"],
  },
  alternates: {
    canonical: "/",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={notoSansSC.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans transition-colors">
        <Providers>
          {children}
        </Providers>
        <PwaInstaller />
        <VercelAnalytics />
        <SpeedInsights />
        <ServiceWorkerRegister />
        <SeoJsonLd />
      </body>
    </html>
  )
}
