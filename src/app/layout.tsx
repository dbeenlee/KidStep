import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4CAF50",
}

export const metadata: Metadata = {
  title: "童行 - 每一步，都陪你走",
  description: "帮助幼儿园大班家长科学开展幼小衔接的教练工具",
  icons: {
    icon: "/images/brand/app-icon.png",
    apple: "/images/brand/app-icon.png",
  },
  openGraph: {
    title: "童行 - 每一步，都陪你走",
    description: "帮助幼儿园大班家长科学开展幼小衔接的教练工具",
    images: ["/images/brand/logo-horizontal.jpg"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground transition-colors">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
