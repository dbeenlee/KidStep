/**
 * SEO JSON-LD 结构化数据组件
 * @see https://developers.google.com/search/docs/advanced/structured-data
 */

export function SeoJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kidstep.app"

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "童行",
    alternateName: "KidStep",
    url: baseUrl,
    logo: `${baseUrl}/images/brand/app-icon.png`,
    description: "帮助幼儿园大班家长科学开展幼小衔接的教练工具",
    sameAs: [],
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "童行",
    alternateName: "KidStep",
    url: baseUrl,
    description: "帮助幼儿园大班家长科学开展幼小衔接的教练工具",
    inLanguage: "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/knowledge?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "童行",
    alternateName: "KidStep",
    url: baseUrl,
    description: "帮助幼儿园大班家长科学开展幼小衔接的教练工具",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "100",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication) }}
      />
    </>
  )
}
