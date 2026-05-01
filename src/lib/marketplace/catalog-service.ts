import { QuoteRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { Category, Locale, QuoteRequestPreview, ServiceSummary } from "@/lib/types";

function formatPhpRange(min: unknown, max: unknown) {
  const minValue = Math.round(Number(min));
  const maxValue = Math.round(Number(max));

  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return "견적 가능";
  }

  return `PHP ${minValue.toLocaleString("en-PH")} ~ ${maxValue.toLocaleString("en-PH")}`;
}

function formatDate(value: Date | null, locale: Locale) {
  if (!value) {
    return locale === "en" ? "Schedule flexible" : locale === "fil" ? "Flexible ang schedule" : "일정 협의";
  }

  const formatterLocale = locale === "ko" ? "ko-KR" : locale === "fil" ? "fil-PH" : "en-US";

  return new Intl.DateTimeFormat(formatterLocale, {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

function serviceTags(durationMinutes: number, categoryName: string) {
  const durationLabel =
    durationMinutes >= 60 ? `${Math.round(durationMinutes / 60)}시간 예상` : `${durationMinutes}분 예상`;

  return [categoryName, durationLabel, "검증된 전문가"];
}

function getServiceTags(service: { tags: string[]; durationMinutes: number; category: { name: string } }) {
  if (service.tags.length > 0) {
    return service.tags;
  }

  return serviceTags(service.durationMinutes, service.category.name);
}

export async function listMarketplaceCategories(locale: Locale): Promise<Category[]> {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      services: {
        where: { isPublished: true },
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
      ? `PHP ${Math.round(Number(lowestPrice)).toLocaleString("en-PH")}부터`
      : locale === "en"
        ? "Quote available"
        : locale === "fil"
          ? "Puwedeng mag-request ng quote"
          : "견적 요청 가능";

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
  take?: number;
}): Promise<ServiceSummary[]> {
  const services = await prisma.service.findMany({
    where: {
      isPublished: true,
      category: params?.categorySlug
        ? {
            slug: params.categorySlug,
            isActive: true,
          }
        : {
            isActive: true,
          },
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

  return services.map((service) => ({
    id: service.id,
    slug: service.slug,
    title: service.title,
    categorySlug: service.category.slug,
    providerName: service.owner.fullName,
    providerSlug: service.owner.id,
    location: service.serviceArea ?? service.owner.city ?? service.category.name,
    priceLabel: formatPhpRange(service.basePriceMin, service.basePriceMax),
    rating: service.owner.tradesmanProfile?.averageRating ?? 0,
    reviewCount: service.owner.tradesmanProfile?.completedJobs ?? 0,
    arrival: service.shortDescription,
    tags: getServiceTags(service),
  }));
}

export async function getMarketplaceServiceBySlug(slug: string): Promise<ServiceSummary | null> {
  const services = await listMarketplaceServices({ take: 100 });
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
        : locale === "en"
          ? "Budget flexible"
          : locale === "fil"
            ? "Flexible ang budget"
            : "예산 협의",
    targetDate: formatDate(request.targetDate, locale),
    summary: request.description,
    bidsCount: request.quotes.length,
    status: "open",
  }));
}
