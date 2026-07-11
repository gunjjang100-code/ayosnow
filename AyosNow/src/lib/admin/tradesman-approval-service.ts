import { TradesmanApprovalStatus, UserRole } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";
import { syncProfessionalBadgesForProfile } from "@/lib/professional-badges/professional-badge-service";
import {
  normalizeTradesmanProfileBio,
  normalizeTradesmanProfileHeadline,
} from "@/lib/tradesmen/profile-text";

export interface AdminTradesmanApprovalItem {
  profileId: string;
  userId: string;
  fullName: string;
  email: string;
  headline: string;
  bio: string;
  experienceYears: number;
  serviceRadiusKm: number;
  isVerified: boolean;
  certificationCount: number;
  portfolioCount: number;
  serviceNames: string[];
  latestStatus: TradesmanApprovalStatus | "NOT_SUBMITTED";
  latestReviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export async function listTradesmanApprovalItems(): Promise<AdminTradesmanApprovalItem[]> {
  const profiles = await prisma.tradesmanProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      certifications: {
        select: {
          id: true,
        },
      },
      portfolioItems: {
        select: {
          id: true,
        },
      },
      skillLinks: {
        include: {
          category: {
            select: {
              nameEn: true,
              name: true,
            },
          },
        },
      },
      approvalRequests: {
        orderBy: {
          submittedAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: [{ isVerified: "asc" }, { updatedAt: "desc" }],
  });

  return profiles
    .filter((profile) => profile.user.role === UserRole.TRADESMAN)
    .map((profile) => {
      const latestApproval = profile.approvalRequests[0];

      return {
        profileId: profile.id,
        userId: profile.userId,
        fullName: profile.user.fullName,
        email: profile.user.email,
        headline: normalizeTradesmanProfileHeadline({
          headline: profile.headline,
          fullName: profile.user.fullName,
        }),
        bio: normalizeTradesmanProfileBio(profile.bio),
        experienceYears: profile.experienceYears,
        serviceRadiusKm: profile.serviceRadiusKm,
        isVerified: profile.isVerified,
        certificationCount: profile.certifications.length,
        portfolioCount: profile.portfolioItems.length,
        serviceNames: profile.skillLinks.map(
          (skill) => skill.category.nameEn ?? skill.category.name,
        ),
        latestStatus: latestApproval?.status ?? "NOT_SUBMITTED",
        latestReviewNote: latestApproval?.reviewNote ?? null,
        submittedAt: latestApproval?.submittedAt.toISOString() ?? null,
        reviewedAt: latestApproval?.reviewedAt?.toISOString() ?? null,
      };
    });
}

export async function reviewTradesmanApproval(params: {
  profileId: string;
  adminUserId: string;
  status: TradesmanApprovalStatus;
  reviewNote?: string;
}) {
  const profile = await prisma.tradesmanProfile.findUnique({
    where: { id: params.profileId },
    include: {
      user: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!profile || profile.user.role !== UserRole.TRADESMAN) {
    throw new AppError("Professional profile was not found.", 404);
  }

  const trimmedReviewNote = params.reviewNote?.trim() || null;
  const isVerified = params.status === TradesmanApprovalStatus.APPROVED;

  const [approval] = await prisma.$transaction([
    prisma.tradesmanApprovalRequest.create({
      data: {
        profileId: profile.id,
        reviewerAdminId: params.adminUserId,
        status: params.status,
        reviewNote: trimmedReviewNote,
        reviewedAt: new Date(),
      },
    }),
    prisma.tradesmanProfile.update({
      where: { id: profile.id },
      data: {
        isVerified,
        identityVerifiedAt: isVerified ? new Date() : null,
        identityVerifiedById: isVerified ? params.adminUserId : null,
      },
    }),
  ]);

  await syncProfessionalBadgesForProfile({
    profileId: profile.id,
    actorAdminId: params.adminUserId,
    reason: isVerified
      ? "Professional approval completed by admin."
      : "Professional approval was not granted.",
  });

  return {
    id: approval.id,
    profileId: approval.profileId,
    status: approval.status,
    reviewNote: approval.reviewNote,
    reviewedAt: approval.reviewedAt?.toISOString() ?? null,
  };
}
