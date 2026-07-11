import { appUrl, canonicalUrl } from "../seo.ts";

interface RequestTip {
  title: string;
  description: string;
}

interface ServiceFaq {
  question: string;
  answer: string;
}

export interface LocalServicePage {
  location: {
    slug: "pangasinan";
    name: "Pangasinan";
    region: "Ilocos Region";
  };
  service: {
    slug: string;
    name: string;
    professionalName: string;
    categoryLabel: string;
    searchQuery: string;
  };
  metadataTitle: string;
  metadataDescription: string;
  headline: string;
  introduction: string;
  overview: string;
  localContext: string;
  commonJobs: readonly string[];
  requestTips: readonly RequestTip[];
  choosingProfessional: string;
  faqs: readonly ServiceFaq[];
}

const pangasinan = {
  slug: "pangasinan",
  name: "Pangasinan",
  region: "Ilocos Region",
} as const;

// 이 목록이 공개 스위치다. 여기에 없는 도시와 서비스 조합은 404로 처리된다.
export const localServicePages = [
  {
    location: pangasinan,
    service: {
      slug: "electrician",
      name: "Electrical Services",
      professionalName: "Electrician",
      categoryLabel: "Electrician",
      searchQuery: "Electrician",
    },
    metadataTitle: "Electricians in Pangasinan",
    metadataDescription:
      "Compare electricians serving Pangasinan for wiring checks, breaker issues, lighting, outlets, and installations. Review profiles and request quotes on PuntaGo.",
    headline: "Find an electrician in Pangasinan",
    introduction:
      "Compare local electrical professionals for home wiring, lighting, outlet, breaker, and troubleshooting work across Pangasinan.",
    overview:
      "Electrical problems can range from a single faulty outlet to a larger wiring concern. A clear request helps a professional understand whether the job is an inspection, repair, replacement, or new installation before proposing a visit.",
    localContext:
      "PuntaGo helps customers describe electrical work in homes and small properties across Pangasinan, including communities around Dagupan, Lingayen, Urdaneta, San Carlos, and Alaminos. Availability still depends on each approved professional's service area and schedule.",
    commonJobs: [
      "Electrical wiring and rewiring checks",
      "Outlet, switch, and lighting installation",
      "Circuit breaker inspection and replacement",
      "Electrical fault and power issue troubleshooting",
    ],
    requestTips: [
      {
        title: "Describe the symptom",
        description: "Mention flickering lights, heat, unusual smells, sparks, or repeated breaker trips.",
      },
      {
        title: "List the affected areas",
        description: "State which rooms, outlets, lights, or appliances are involved.",
      },
      {
        title: "Add safe photos",
        description: "Share photos of the panel or fixture only when you can take them without touching exposed wiring.",
      },
    ],
    choosingProfessional:
      "Compare the proposed scope, visit schedule, experience, and explanation of any materials needed. Electrical work may require permits or a licensed practitioner depending on the job, so ask the professional what applies before work begins.",
    faqs: [
      {
        question: "Can I request a quote for a breaker that keeps tripping?",
        answer:
          "Yes. Explain when it trips and what was running at the time. Do not repeatedly reset a breaker if you notice heat, smoke, sparks, or a burning smell.",
      },
      {
        question: "Should I buy electrical materials before the visit?",
        answer:
          "It is usually better to confirm the diagnosis and exact specifications first. The quote should clarify whether materials are included or purchased separately.",
      },
    ],
  },
  {
    location: pangasinan,
    service: {
      slug: "plumber",
      name: "Plumbing Services",
      professionalName: "Plumber",
      categoryLabel: "Plumber",
      searchQuery: "Plumber",
    },
    metadataTitle: "Plumbers in Pangasinan",
    metadataDescription:
      "Compare plumbers serving Pangasinan for leaks, clogged drains, low water pressure, toilet repairs, and fixture installation. Review profiles and request quotes.",
    headline: "Find a plumber in Pangasinan",
    introduction:
      "Compare local plumbers for leaks, blocked drains, low water pressure, toilet repairs, and fixture installation in Pangasinan.",
    overview:
      "A plumbing quote is easier to assess when the source, location, and urgency of the problem are clear. Include whether water can be shut off, how long the issue has been present, and whether it affects one fixture or the whole property.",
    localContext:
      "Customers can post plumbing requests for homes and small properties across Pangasinan. Professionals choose requests according to their approved categories, travel radius, availability, and the information supplied in the job description.",
    commonJobs: [
      "Leaking pipe, faucet, and connection repair",
      "Clogged sink, toilet, and drain service",
      "Bathroom and kitchen fixture installation",
      "Low water pressure and water line checks",
    ],
    requestTips: [
      {
        title: "Locate the problem",
        description: "Identify the nearest sink, toilet, wall, floor drain, or outdoor line.",
      },
      {
        title: "Explain the water flow",
        description: "Say whether the issue is constant, intermittent, slow, overflowing, or completely blocked.",
      },
      {
        title: "Confirm access",
        description: "Mention if the pipe is exposed, behind a wall, under a sink, or difficult to reach.",
      },
    ],
    choosingProfessional:
      "Check whether the quote covers diagnosis, labor, replacement parts, cleanup, and follow-up work. For concealed leaks or drainage problems, the final scope may change after inspection, so ask how price changes will be approved.",
    faqs: [
      {
        question: "What should I do before a plumber arrives for a leak?",
        answer:
          "If it is safe and practical, turn off the nearest valve or main water supply, move valuables away, and take photos of visible damage for the request.",
      },
      {
        question: "Can a plumber quote a blocked drain from photos alone?",
        answer:
          "Photos and symptoms help, but some blockages require an on-site inspection. Ask whether the quoted amount is fixed or an initial estimate.",
      },
    ],
  },
  {
    location: pangasinan,
    service: {
      slug: "aircon-repair",
      name: "Aircon Repair",
      professionalName: "Aircon Technician",
      categoryLabel: "Air Conditioning",
      searchQuery: "Aircon",
    },
    metadataTitle: "Aircon Repair in Pangasinan",
    metadataDescription:
      "Find aircon repair options in Pangasinan for units that are not cooling, leaking, noisy, or showing errors. Compare professional profiles and request quotes.",
    headline: "Find aircon repair in Pangasinan",
    introduction:
      "Compare local aircon technicians for weak cooling, leaks, unusual sounds, error codes, cleaning, and diagnosis across Pangasinan.",
    overview:
      "Aircon cleaning and aircon repair are not always the same job. Weak cooling may come from dirt, airflow, drainage, controls, or a component issue. Sharing the unit type and symptoms helps a technician prepare the right inspection.",
    localContext:
      "Pangasinan's warm and humid conditions can make a faulty air conditioner disruptive. PuntaGo lets customers provide the service location and preferred date, while approved technicians decide whether the request matches their skills and travel area.",
    commonJobs: [
      "Weak or uneven cooling diagnosis",
      "Water leak and drainage inspection",
      "Aircon cleaning and routine maintenance",
      "Noise, odor, power, and error-code troubleshooting",
    ],
    requestTips: [
      {
        title: "Identify the unit",
        description: "Include the brand, model if visible, unit type, approximate age, and number of units.",
      },
      {
        title: "Describe when it happens",
        description: "State whether the issue starts immediately, after running for a while, or only at certain settings.",
      },
      {
        title: "Separate cleaning from repair",
        description: "Mention the last cleaning date and any error code, leak, noise, or electrical symptom.",
      },
    ],
    choosingProfessional:
      "Compare what the inspection includes, whether cleaning is part of the quote, and how replacement parts or refrigerant work would be approved. Do not rely on a refrigerant refill alone without asking why it may be needed.",
    faqs: [
      {
        question: "How do I know whether I need cleaning or repair?",
        answer:
          "Reduced airflow and dirt may improve with cleaning, while leaks, error codes, electrical problems, or unusual noise may need diagnosis and repair. A technician should confirm the cause.",
      },
      {
        question: "What information helps an aircon technician quote the job?",
        answer:
          "Provide the unit type, brand, number of units, symptoms, recent maintenance history, floor level, and safe access conditions.",
      },
    ],
  },
  {
    location: pangasinan,
    service: {
      slug: "cleaning",
      name: "Cleaning Services",
      professionalName: "Cleaning Professional",
      categoryLabel: "Cleaning",
      searchQuery: "Cleaning",
    },
    metadataTitle: "Cleaning Services in Pangasinan",
    metadataDescription:
      "Compare cleaning services in Pangasinan for regular cleaning, deep cleaning, move-in or move-out jobs, and small offices. Check scope and request quotes.",
    headline: "Find cleaning services in Pangasinan",
    introduction:
      "Compare local cleaning professionals for routine home cleaning, detailed deep cleaning, move-related jobs, and small offices in Pangasinan.",
    overview:
      "Cleaning quotes depend on the size and condition of the space, the rooms included, and the level of detail expected. A useful request separates routine tasks from deep-cleaning items and states whether supplies or equipment are available.",
    localContext:
      "PuntaGo supports cleaning requests for occupied homes, apartments, rental turnovers, and small workspaces across Pangasinan. Each professional sets a service radius and can review the requested scope before offering a price and schedule.",
    commonJobs: [
      "Regular home and apartment cleaning",
      "One-time deep cleaning",
      "Move-in and move-out cleaning",
      "Kitchen, bathroom, and small-office cleaning",
    ],
    requestTips: [
      {
        title: "Give the space size",
        description: "Include the number of rooms and bathrooms, floor area if known, and property type.",
      },
      {
        title: "Define the scope",
        description: "List priorities such as appliances, windows, cabinets, stains, pet hair, or outdoor areas.",
      },
      {
        title: "Clarify supplies",
        description: "State whether cleaning products, a vacuum, ladder, parking, or water access are available.",
      },
    ],
    choosingProfessional:
      "Compare the included rooms and tasks, expected duration, team size, supplies, and any exclusions. Confirm extra charges before the visit for heavy buildup, high windows, post-construction debris, or large items.",
    faqs: [
      {
        question: "What is the difference between regular and deep cleaning?",
        answer:
          "Regular cleaning usually covers recurring surface tasks. Deep cleaning may include detailed buildup removal, inside selected fixtures or cabinets, and areas that need more time. Confirm the exact checklist.",
      },
      {
        question: "Do I need to provide cleaning supplies?",
        answer:
          "That depends on the professional. State what is available and ask the quote to identify who supplies products and equipment.",
      },
    ],
  },
  {
    location: pangasinan,
    service: {
      slug: "appliance-repair",
      name: "Appliance Repair",
      professionalName: "Appliance Repair Technician",
      categoryLabel: "Appliance Repair",
      searchQuery: "Appliance Repair",
    },
    metadataTitle: "Appliance Repair in Pangasinan",
    metadataDescription:
      "Find appliance repair options in Pangasinan for refrigerators, washing machines, ovens, and other home appliances. Compare profiles and request quotes.",
    headline: "Find appliance repair in Pangasinan",
    introduction:
      "Compare local appliance technicians for refrigerators, washing machines, cooking appliances, and other household units in Pangasinan.",
    overview:
      "An appliance repair request should identify the exact unit and symptom before a technician visits. The brand, model number, age, error code, and recent behavior can help distinguish a simple service call from work that may need a specific part.",
    localContext:
      "Customers across Pangasinan can post appliance symptoms and photos on PuntaGo. Approved technicians review the request based on the appliance type, their experience, available parts, travel area, and preferred service date.",
    commonJobs: [
      "Refrigerator cooling and temperature problems",
      "Washing machine fill, drain, spin, and leak issues",
      "Oven, stove, and cooking appliance checks",
      "Small household appliance diagnosis",
    ],
    requestTips: [
      {
        title: "Find the model details",
        description: "Share the brand, model number, approximate age, and a clear photo of the label when possible.",
      },
      {
        title: "Record the symptom",
        description: "Include error codes, sounds, smells, leaks, temperature changes, and when the problem began.",
      },
      {
        title: "Explain previous work",
        description: "Mention recent repairs, moved equipment, power events, or parts already replaced.",
      },
    ],
    choosingProfessional:
      "Ask whether the quote covers diagnosis only or includes labor and parts. Confirm warranty terms for replacement parts and whether the technician supports the appliance brand before accepting the quote.",
    faqs: [
      {
        question: "Can I get an exact appliance repair price before inspection?",
        answer:
          "Sometimes, but many symptoms have several possible causes. Ask whether the first quote is a diagnostic fee, an estimate, or a fixed total including parts.",
      },
      {
        question: "What should I do if an appliance smells burnt or sparks?",
        answer:
          "Stop using it and disconnect power only if you can do so safely. Keep others away and describe the safety concern clearly in the request.",
      },
    ],
  },
] as const satisfies readonly LocalServicePage[];

export type LocalServicePageEntry = (typeof localServicePages)[number];

export function getLocalServicePage(locationSlug: string, serviceSlug: string) {
  return localServicePages.find(
    (page) => page.location.slug === locationSlug && page.service.slug === serviceSlug,
  );
}

export function getLocalServiceStaticParams() {
  return localServicePages.map((page) => ({
    location: page.location.slug,
    service: page.service.slug,
  }));
}

export function getRelatedLocalServicePages(currentPage: LocalServicePageEntry) {
  return localServicePages.filter(
    (page) =>
      page.location.slug === currentPage.location.slug &&
      page.service.slug !== currentPage.service.slug,
  );
}

export function getLocalServicePath(page: LocalServicePageEntry) {
  return `/${page.location.slug}/${page.service.slug}` as const;
}

export function buildLocalServiceStructuredData(page: LocalServicePageEntry) {
  const url = canonicalUrl(getLocalServicePath(page));
  const locationUrl = canonicalUrl(`/${page.location.slug}`);
  const serviceId = `${url}#service`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: appUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: page.location.name,
            item: locationUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: page.service.name,
            item: url,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        name: `${page.metadataTitle} | PuntaGo`,
        url,
        description: page.metadataDescription,
        inLanguage: "en-PH",
        isPartOf: {
          "@id": `${appUrl}/#website`,
        },
        breadcrumb: {
          "@id": `${url}#breadcrumb`,
        },
        about: {
          "@id": serviceId,
        },
      },
      {
        "@type": "Service",
        "@id": serviceId,
        name: page.service.name,
        serviceType: page.service.name,
        url,
        description: page.introduction,
        areaServed: {
          "@type": "AdministrativeArea",
          name: page.location.name,
          containedInPlace: {
            "@type": "AdministrativeArea",
            name: page.location.region,
          },
        },
      },
    ],
  };
}
