import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getVisibleProfessionalBadgesForProfiles } from "@/lib/professional-badges/professional-badge-service";
import {
  normalizeTradesmanProfileBio,
  normalizeTradesmanProfileHeadline,
} from "@/lib/tradesmen/profile-text";
import type { Locale, TradesmanProfileData } from "@/lib/types";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatPhp(value: unknown) {
  const amount = Math.round(Number(value));
  if (!Number.isFinite(amount)) {
    return "Quote available";
  }

  return `PHP ${amount.toLocaleString("en-PH")} and up`;
}

function formatResponseTime(locale: Locale, responseRate: number) {
  if (responseRate <= 0) {
    return locale === "en"
      ? "Usually replies after review"
      : locale === "fil"
        ? "Karaniwang sumasagot pagkatapos ng review"
        : "Response after request review";
  }

  return locale === "en"
    ? `${responseRate}% response rate`
    : locale === "fil"
      ? `${responseRate}% response rate`
      : `Response rate ${responseRate}%`;
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export async function getTradesmanProfileBySlug(
  slug: string,
  locale: Locale,
): Promise<TradesmanProfileData | null> {
  const directMatch = await prisma.user.findFirst({
    where: {
      role: UserRole.TRADESMAN,
      status: "ACTIVE",
      tradesmanProfile: {
        isVerified: true,
      },
      OR: [
        { id: slug },
        {
          services: {
            some: {
              slug,
              isPublished: true,
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  let tradesmanId = directMatch?.id ?? null;

  // Keep old name-based links working while new links use the stable user ID.
  if (!tradesmanId) {
    const verifiedTradesmen = await prisma.user.findMany({
      where: {
        role: UserRole.TRADESMAN,
        status: "ACTIVE",
        tradesmanProfile: {
          isVerified: true,
        },
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    tradesmanId =
      verifiedTradesmen.find((candidate) => slugify(candidate.fullName) === slug)?.id ?? null;
  }

  if (!tradesmanId) {
    return null;
  }

  const tradesman = await prisma.user.findFirst({
    where: {
      id: tradesmanId,
      role: UserRole.TRADESMAN,
      status: "ACTIVE",
      tradesmanProfile: {
        isVerified: true,
      },
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
  });

  if (!tradesman || !tradesman.tradesmanProfile) {
    return null;
  }

  const profile = tradesman.tradesmanProfile;
  const badgeMap = await getVisibleProfessionalBadgesForProfiles([profile.id]);
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
    headline: normalizeTradesmanProfileHeadline({
      headline: profile.headline,
      fullName: tradesman.fullName,
    }),
    bio: normalizeTradesmanProfileBio(profile.bio),
    skills: skills.length > 0 ? skills : ["Service consultation available"],
    certificates: profile.certifications.map((item) => ({
      id: item.id,
      title: item.title,
      issuer: item.issuer,
      acquiredAt: toIso(item.acquiredAt),
      expiresAt: toIso(item.expiresAt),
      fileUrl: item.fileUrl,
    })),
    portfolio: profile.portfolioItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
    })),
    serviceAreas: serviceAreas.length > 0 ? serviceAreas : ["Service area flexible"],
    rating: profile.averageRating,
    badges: badgeMap.get(profile.id) ?? [],
    reviewCount: tradesman.receivedReviews.length,
    completedJobs: profile.completedJobs,
    responseTime: formatResponseTime(locale, profile.responseRate),
    startingPrice: primaryService
      ? formatPhp(primaryService.basePriceMin)
      : locale === "en"
        ? "Quote available"
        : locale === "fil"
          ? "Puwedeng mag-request ng quote"
          : "Quote request available",
    reviews: tradesman.receivedReviews.map((review) => ({
      id: review.id,
      author: review.author.fullName,
      rating: review.rating,
      comment: review.comment,
      photoUrl: review.photoUrl,
      createdAt: review.createdAt.toISOString(),
    })),
  };
}
