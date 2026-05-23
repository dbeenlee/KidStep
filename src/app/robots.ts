import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kidstep.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/profile/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
