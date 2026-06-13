import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { Locale, TradesmanProfileData } from "@/lib/types";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatPhp(value: unknown) {
  const amount = Math.round(Number(value));
  if (!Number.isFinite(amount)) {
    return "견적 가능";
  }

  return `PHP ${amount.toLocaleString("en-PH")}부터`;
}

function formatResponseTime(locale: Locale, responseRate: number) {
  if (responseRate <= 0) {
    return locale === "en"
      ? "Usually replies after review"
      : locale === "fil"
        ? "Karaniwang sumasagot pagkatapos ng review"
        : "요청 확인 후 응답";
  }

  return locale === "en"
    ? `${responseRate}% response rate`
    : locale === "fil"
      ? `${responseRate}% response rate`
      : `응답률 ${responseRate}%`;
}

export async function getTradesmanProfileBySlug(
  slug: string,
  locale: Locale,
): Promise<TradesmanProfileData | null> {
  const tradesmen = await prisma.user.findMany({
    where: {
      role: UserRole.TRADESMAN,
      status: "ACTIVE",
      OR: [
        { id: slug },
        {
          services: {
            some: {
              slug,
            },
          },
        },
      ],
    },
    include: {
      tradesmanProfile: {
        include: {
          certifications: true,
          portfolioItems: {
            orderBy: { createdAt: "desc" },
            take: 6,
          },
          skillLinks: {
            include: {
              category: true,
            },
            orderBy: [{ isPrimary: "desc" }, { years: "desc" }],
          },
        },
      },
      services: {
        where: { isPublished: true },
        include: { category: true },
        orderBy: [{ basePriceMin: "asc" }],
        take: 6,
      },
      receivedReviews: {
        include: {
          author: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
    },
    take: 50,
  });

  const tradesman =
    tradesmen.find((item) => item.id === slug) ??
    tradesmen.find((item) => slugify(item.fullName) === slug) ??
    tradesmen.find((item) => item.services.some((service) => service.slug === slug));

  if (!tradesman || !tradesman.tradesmanProfile) {
    return null;
  }

  const profile = tradesman.tradesmanProfile;
  const primaryService = tradesman.services[0];
  const skills =
    profile.skillLinks.length > 0
      ? profile.skillLinks.map((skill) => skill.category.name)
      : tradesman.services.map((service) => service.category.name);
  const serviceAreas = [
    ...new Set(
      tradesman.services
        .map((service) => service.serviceArea)
        .concat([tradesman.city, tradesman.barangay])
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  return {
    slug: tradesman.id,
    name: tradesman.fullName,
    headline: profile.headline,
    bio: profile.bio,
    skills: skills.length > 0 ? skills : ["서비스 상담 가능"],
    certificates: profile.certifications.map((item) => item.title),
    portfolio: profile.portfolioItems.map((item) => item.title),
    serviceAreas: serviceAreas.length > 0 ? serviceAreas : ["지역 협의"],
    rating: profile.averageRating,
    reviewCount: tradesman.receivedReviews.length,
    completedJobs: profile.completedJobs,
    responseTime: formatResponseTime(locale, profile.responseRate),
    startingPrice: primaryService
      ? formatPhp(primaryService.basePriceMin)
      : locale === "en"
        ? "Quote available"
        : locale === "fil"
          ? "Puwedeng mag-request ng quote"
          : "견적 요청 가능",
    reviews: tradesman.receivedReviews.map((review) => ({
      id: review.id,
      author: review.author.fullName,
      rating: review.rating,
      comment: review.comment,
    })),
  };
}

