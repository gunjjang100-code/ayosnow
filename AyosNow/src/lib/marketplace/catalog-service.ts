import { AccountStatus, QuoteRequestStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getVisibleProfessionalBadgesForProfiles } from "@/lib/professional-badges/professional-badge-service";
import type { Category, Locale, QuoteRequestPreview, ReviewPreview, ServiceSummary } from "@/lib/types";

function formatPhpRange(min: unknown, max: unknown) {
  const minValue = Math.round(Number(min));
  const maxValue = Math.round(Number(max));

  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return "Quote available";
  }

  return `PHP ${minValue.toLocaleString("en-PH")} ~ ${maxValue.toLocaleString("en-PH")}`;
}

function formatDate(value: Date | null, locale: Locale) {
  if (!value) {
    return locale === "fil" ? "Flexible ang schedule" : "Schedule flexible";
  }

  const formatterLocale = locale === "fil" ? "fil-PH" : "en-US";

  return new Intl.DateTimeFormat(formatterLocale, {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

function serviceTags(durationMinutes: number, categoryName: string, locale: Locale) {
  const durationLabel =
    durationMinutes >= 60
      ? locale === "fil"
        ? `${Math.round(durationMinutes / 60)} oras estimate`
        : `${Math.round(durationMinutes / 60)} hr estimate`
      : `${durationMinutes} min estimate`;

  return [
    categoryName,
    durationLabel,
    locale === "fil" ? "Verified professional" : "Verified professional",
  ];
}

function formatDuration(durationMinutes: number, locale: Locale) {
  if (durationMinutes >= 60) {
    const hours = Math.round(durationMinutes / 60);
    return locale === "fil" ? `${hours} oras` : `${hours} hr`;
  }

  return `${durationMinutes} min`;
}

function formatResponseTime(responseRate: number | null | undefined, locale: Locale) {
  if (!responseRate || responseRate <= 0) {
    return locale === "fil" ? "Awaiting response" : "Awaiting response";
  }

  if (responseRate >= 90) {
    return locale === "fil" ? "Usually within 10 minutes" : "Usually within 10 minutes";
  }

  if (responseRate >= 70) {
    return locale === "fil" ? "Usually within 30 minutes" : "Usually within 30 minutes";
  }

  return locale === "fil" ? "Usually within the day" : "Usually within the day";
}

function parseStoredTags(tags: string) {
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function getServiceTags(
  service: { tags: string; durationMinutes: number; category: { name: string } },
  locale: Locale,
) {
  const tags = parseStoredTags(service.tags);

  if (tags.length > 0) {
    return tags;
  }

  return serviceTags(service.durationMinutes, service.category.name, locale);
}

export async function listMarketplaceCategories(locale: Locale): Promise<Category[]> {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      services: {
        where: {
          isPublished: true,
          owner: {
            role: UserRole.TRADESMAN,
            status: AccountStatus.ACTIVE,
            tradesmanProfile: {
              isVerified: true,
            },
          },
        },
        select: {
          basePriceMin: true,
        },
        orderBy: {
          basePriceMin: "asc",
        },
        take: 1,
      },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => {
    const lowestPrice = category.services[0]?.basePriceMin;
    const startingPrice = lowestPrice
      ? locale === "fil"
        ? `Mula PHP ${Math.round(Number(lowestPrice)).toLocaleString("en-PH")}`
        : `From PHP ${Math.round(Number(lowestPrice)).toLocaleString("en-PH")}`
      : locale === "en"
        ? "Quote available"
        : "Puwedeng mag-request ng quote";

    return {
      slug: category.slug,
      name: category.name,
      shortDescription: category.description,
      startingPrice,
    };
  });
}

export async function listMarketplaceServices(params?: {
  categorySlug?: string;
  query?: string;
  take?: number;
  locale?: Locale;
}): Promise<ServiceSummary[]> {
  const query = params?.query?.trim();
  const locale = params?.locale ?? "en";
  const services = await prisma.service.findMany({
    where: {
      isPublished: true,
      owner: {
        role: UserRole.TRADESMAN,
        status: AccountStatus.ACTIVE,
        tradesmanProfile: {
          isVerified: true,
        },
      },
      category: params?.categorySlug
        ? {
            slug: params.categorySlug,
            isActive: true,
          }
        : {
            isActive: true,
          },
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { shortDescription: { contains: query } },
              { serviceArea: { contains: query } },
              { category: { name: { contains: query } } },
              { owner: { fullName: { contains: query } } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      owner: {
        include: {
          tradesmanProfile: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: params?.take,
  });

  const profileIds = services
    .map((service) => service.owner.tradesmanProfile?.id)
    .filter((value): value is string => Boolean(value));
  const badgeMap = await getVisibleProfessionalBadgesForProfiles(profileIds);

  return services.map((service) => ({
    id: service.id,
    slug: service.slug,
    title: service.title,
    categorySlug: service.category.slug,
    categoryName: service.category.name,
    providerName: service.owner.fullName,
    providerSlug: service.owner.id,
    location: service.serviceArea ?? service.owner.city ?? service.category.name,
    priceLabel: formatPhpRange(service.basePriceMin, service.basePriceMax),
    rating: service.owner.tradesmanProfile?.averageRating ?? 0,
    reviewCount: service.owner.tradesmanProfile?.completedJobs ?? 0,
    completedJobs: service.owner.tradesmanProfile?.completedJobs ?? 0,
    responseTime: formatResponseTime(service.owner.tradesmanProfile?.responseRate, locale),
    durationLabel: formatDuration(service.durationMinutes, locale),
    isVerified: service.owner.tradesmanProfile?.isVerified ?? false,
    providerBadges: service.owner.tradesmanProfile?.id
      ? badgeMap.get(service.owner.tradesmanProfile.id) ?? []
      : [],
    arrival: service.shortDescription,
    tags: getServiceTags(service, locale),
  }));
}

export async function getMarketplaceServiceBySlug(
  slug: string,
  locale: Locale = "en",
): Promise<ServiceSummary | null> {
  const services = await listMarketplaceServices({ take: 100, locale });
  return services.find((item) => item.slug === slug) ?? null;
}

export async function listOpenQuoteRequestPreviews(
  locale: Locale,
  take = 2,
): Promise<QuoteRequestPreview[]> {
  const requests = await prisma.quoteRequest.findMany({
    where: {
      status: QuoteRequestStatus.OPEN,
    },
    include: {
      category: true,
      quotes: {
        select: {
          id: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take,
  });

  return requests.map((request) => ({
    id: request.id,
    serviceName: request.title,
    location: request.city,
    budgetLabel:
      request.budgetMin && request.budgetMax
        ? formatPhpRange(request.budgetMin, request.budgetMax)
        : locale === "fil"
          ? "Flexible ang budget"
          : "Budget flexible",
    targetDate: formatDate(request.targetDate, locale),
    summary: request.description,
    bidsCount: request.quotes.length,
    status: "open",
  }));
}

export async function listRecentReviewPreviews(take = 6): Promise<ReviewPreview[]> {
  const reviews = await prisma.review.findMany({
    include: {
      author: {
        select: {
          fullName: true,
          city: true,
        },
      },
      targetUser: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return reviews.map((review) => ({
    id: review.id,
    author: review.author.fullName,
    rating: review.rating,
    comment: review.comment,
    photoUrl: review.photoUrl,
    targetName: review.targetUser.fullName,
    location: review.author.city ?? undefined,
    createdAt: review.createdAt.toISOString(),
  }));
}

export async function getMarketplaceStats() {
  const [jobsCompleted, professionals, reviewStats, customerCount] = await Promise.all([
    prisma.booking.count({
      where: { status: "COMPLETED" },
    }),
    prisma.user.count({
      where: {
        role: UserRole.TRADESMAN,
        status: AccountStatus.ACTIVE,
        tradesmanProfile: {
          isVerified: true,
        },
      },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    }),
  ]);

  const averageRating = reviewStats._avg.rating ?? 0;

  return {
    jobsCompleted,
    professionals,
    averageRating: Number(averageRating.toFixed(1)),
    customerSatisfaction: reviewStats._count.id > 0 ? Math.round((averageRating / 5) * 100) : 0,
    activeCustomers: customerCount,
  };
}
