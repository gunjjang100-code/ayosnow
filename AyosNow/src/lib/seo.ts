import type { Metadata } from "next";

export const appUrl = (
  process.env.APP_URL ??
  process.env.NEXTAUTH_URL ??
  "https://puntago.net"
).replace(/\/$/, "");

export const brandPositioning = {
  name: "PuntaGo",
  tagline: "One platform for every trusted local professional.",
  launchMessage: "Starting in Pangasinan. Built for the Philippines.",
  defaultTitle:
    "PuntaGo | Trusted Local Professionals in Pangasinan and the Philippines",
  defaultDescription:
    "Find verified local professionals, compare fair quotations, book services, chat safely, and manage everyday local work with PuntaGo.",
};

export const localSeoLocations = [
  {
    slug: "pangasinan",
    name: "Pangasinan",
    region: "Ilocos Region",
    status: "now-serving",
    headline: "Trusted local professionals in Pangasinan",
    description:
      "PuntaGo is starting in Pangasinan with verified local professionals, fair quotations, fast matching, safe chat, bookings, reviews, and notifications.",
  },
  {
    slug: "dagupan",
    name: "Dagupan",
    region: "Pangasinan",
    status: "coming-soon",
    headline: "Trusted local professionals in Dagupan",
    description:
      "PuntaGo is preparing local service discovery for Dagupan as the platform grows city by city across Pangasinan and the Philippines.",
  },
  {
    slug: "urdaneta",
    name: "Urdaneta",
    region: "Pangasinan",
    status: "coming-soon",
    headline: "Trusted local professionals in Urdaneta",
    description:
      "PuntaGo is preparing local service discovery for Urdaneta with verified professionals, fair quotations, and safe booking workflows.",
  },
  {
    slug: "manila",
    name: "Manila",
    region: "Metro Manila",
    status: "future-market",
    headline: "Trusted local professionals in Manila",
    description:
      "PuntaGo is built to expand beyond Pangasinan into major Philippine cities such as Manila when operations are ready.",
  },
] as const;

export const professionalCategoryGroups = [
  {
    group: "Home Services",
    items: [
      "Electrician",
      "Plumber",
      "Carpenter",
      "Painter",
      "Cleaning",
      "Air Conditioning",
      "Appliance Repair",
      "Pest Control",
      "Gardening",
    ],
  },
  {
    group: "Food & Hospitality",
    items: ["Private Chef", "Home Cook", "Catering", "BBQ Chef", "Bartender", "Barista"],
  },
  {
    group: "Beauty & Wellness",
    items: ["Makeup Artist", "Hair Stylist", "Nail Technician", "Massage Therapist", "Personal Trainer"],
  },
  {
    group: "Events",
    items: ["Photographer", "Videographer", "Event Staff", "DJ", "Live Band", "Florist", "Event Decorator"],
  },
  {
    group: "Education",
    items: ["Tutor", "Language Teacher", "Music Teacher"],
  },
  {
    group: "Business Services",
    items: ["Accountant", "Graphic Designer", "Web Designer", "IT Support"],
  },
  {
    group: "Transportation",
    items: ["Driver", "Moving Service", "Delivery Helper"],
  },
  {
    group: "Other Services",
    items: ["Pet Grooming", "Babysitting", "Elderly Care", "Laundry", "Tailor", "Security Services"],
  },
] as const;

export function canonicalUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appUrl}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function createPageMetadata({
  title,
  description,
  path,
  image = "/opengraph-image",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = canonicalUrl(path);
  const imageUrl = image.startsWith("http") ? image : `${appUrl}${image}`;

  return {
    metadataBase: new URL(appUrl),
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "PuntaGo",
      locale: "en_PH",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "PuntaGo trusted local professionals platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function buildHomeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${appUrl}/#organization`,
        name: "PuntaGo",
        url: appUrl,
        logo: `${appUrl}/icon`,
        slogan: brandPositioning.tagline,
        areaServed: {
          "@type": "Country",
          name: "Philippines",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: "support@puntago.net",
            areaServed: "PH",
            availableLanguage: ["English", "Filipino"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${appUrl}/#website`,
        name: "PuntaGo",
        url: appUrl,
        publisher: {
          "@id": `${appUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${appUrl}/services?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function buildLocalStructuredData(location: (typeof localSeoLocations)[number]) {
  const url = canonicalUrl(`/${location.slug}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "PuntaGo",
            item: appUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: location.name,
            item: url,
          },
        ],
      },
      {
        "@type": "WebPage",
        name: `${location.name} local services | PuntaGo`,
        url,
        description: location.description,
        isPartOf: {
          "@id": `${appUrl}/#website`,
        },
      },
      {
        "@type": "Service",
        name: `Local professional services in ${location.name}`,
        areaServed: {
          "@type": "Place",
          name: location.name,
        },
        serviceType: professionalCategoryGroups.flatMap((group) => group.items).slice(0, 30),
      },
    ],
  };
}
