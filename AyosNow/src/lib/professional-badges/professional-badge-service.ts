import {
  BookingStatus,
  NotificationRelatedType,
  OneOutCaseStatus,
  ProfessionalBadgeCode,
  ProfessionalBadgeHistoryAction,
  ProfessionalBadgeSource,
} from "@prisma/client";
import crypto from "node:crypto";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROFESSIONAL_BADGE_SETTINGS,
  getEligibleProfessionalBadgeCodes,
  PROFESSIONAL_BADGE_CODES,
  toProfessionalBadgeSummary,
  type ProfessionalBadgeCodeValue,
  type ProfessionalBadgeMetricsSnapshot,
  type ProfessionalBadgeSettingsSnapshot,
  type ProfessionalBadgeSummary,
} from "@/lib/professional-badges/professional-badge-rules";

const GLOBAL_SETTINGS_ID = "global";

const activePenaltyStatuses = [
  OneOutCaseStatus.OPEN,
  OneOutCaseStatus.UNDER_REVIEW,
  OneOutCaseStatus.STRIKE_APPLIED,
  OneOutCaseStatus.SUSPENDED,
];

function toCodeValue(code: ProfessionalBadgeCode): ProfessionalBadgeCodeValue {
  return code as ProfessionalBadgeCodeValue;
}

function toSettingSnapshot(
  value: ProfessionalBadgeSettingsSnapshot | null | undefined,
): ProfessionalBadgeSettingsSnapshot {
  return {
    ...DEFAULT_PROFESSIONAL_BADGE_SETTINGS,
    ...(value ?? {}),
  };
}

function toSnapshotText(metrics: ProfessionalBadgeMetricsSnapshot) {
  return JSON.stringify({
    isVerified: metrics.isVerified,
    identityVerifiedAt:
      metrics.identityVerifiedAt instanceof Date
        ? metrics.identityVerifiedAt.toISOString()
        : metrics.identityVerifiedAt,
    completedBookings: metrics.completedBookings,
    averageRating: metrics.averageRating,
    responseRate: metrics.responseRate,
    cancellationRate: metrics.cancellationRate,
    activePenaltyCount: metrics.activePenaltyCount,
  });
}

export async function getOrCreateProfessionalBadgeSettings() {
  const existing = await prisma.professionalBadgeSetting.findUnique({
    where: { id: GLOBAL_SETTINGS_ID },
  });

  if (existing) {
    return existing;
  }

  return prisma.professionalBadgeSetting.create({
    data: {
      id: GLOBAL_SETTINGS_ID,
      ...DEFAULT_PROFESSIONAL_BADGE_SETTINGS,
    },
  });
}

export async function getProfessionalBadgeSettingsSnapshot() {
  const settings = await getOrCreateProfessionalBadgeSettings();
  return toSettingSnapshot(settings);
}

export async function updateProfessionalBadgeSettings(params: {
  adminUserId: string;
  input: ProfessionalBadgeSettingsSnapshot;
}) {
  const settings = toSettingSnapshot(params.input);

  if (settings.topMinCompletedBookings < 0) {
    throw new AppError("Completed booking threshold cannot be negative.", 400);
  }

  if (settings.topMinAverageRating < 0 || settings.topMinAverageRating > 5) {
    throw new AppError("Average rating threshold must be between 0 and 5.", 400);
  }

  if (settings.topMinResponseRate < 0 || settings.topMinResponseRate > 100) {
    throw new AppError("Response rate threshold must be between 0 and 100.", 400);
  }

  if (settings.topMaxCancellationRate < 0 || settings.topMaxCancellationRate > 100) {
    throw new AppError("Cancellation rate threshold must be between 0 and 100.", 400);
  }

  const saved = await prisma.professionalBadgeSetting.upsert({
    where: { id: GLOBAL_SETTINGS_ID },
    update: {
      ...settings,
      updatedById: params.adminUserId,
    },
    create: {
      id: GLOBAL_SETTINGS_ID,
      ...settings,
      updatedById: params.adminUserId,
    },
  });

  const profiles = await prisma.tradesmanProfile.findMany({
    select: { id: true },
  });

  for (const profile of profiles) {
    await syncProfessionalBadgesForProfile({
      profileId: profile.id,
      actorAdminId: params.adminUserId,
      reason: "Professional badge settings changed.",
    });
  }

  return saved;
}

export async function getProfessionalBadgeMetrics(
  profileId: string,
): Promise<ProfessionalBadgeMetricsSnapshot> {
  const profile = await prisma.tradesmanProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      userId: true,
      isVerified: true,
      identityVerifiedAt: true,
      averageRating: true,
      responseRate: true,
    },
  });

  if (!profile) {
    throw new AppError("Professional profile was not found.", 404);
  }

  const [completedBookings, cancelledBookings, relevantBookings, activePenaltyCount] =
    await Promise.all([
      prisma.booking.count({
        where: { tradesmanId: profile.userId, status: BookingStatus.COMPLETED },
      }),
      prisma.booking.count({
        where: { tradesmanId: profile.userId, status: BookingStatus.CANCELLED },
      }),
      prisma.booking.count({
        where: {
          tradesmanId: profile.userId,
          status: { in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] },
        },
      }),
      prisma.oneOutCase.count({
        where: {
          profileId: profile.id,
          status: { in: activePenaltyStatuses },
        },
      }),
    ]);

  const cancellationRate =
    relevantBookings > 0 ? Math.round((cancelledBookings / relevantBookings) * 100) : 0;

  return {
    isVerified: profile.isVerified,
    identityVerifiedAt: profile.identityVerifiedAt,
    completedBookings,
    averageRating: profile.averageRating,
    responseRate: profile.responseRate,
    cancellationRate,
    activePenaltyCount,
  };
}

export async function refreshTradesmanResponseRateAndBadges(tradesmanId: string) {
  const profile = await prisma.tradesmanProfile.findUnique({
    where: { userId: tradesmanId },
    select: { id: true },
  });

  if (!profile) {
    return null;
  }

  const [requestNotifications, submittedQuotes] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: tradesmanId,
        relatedType: NotificationRelatedType.QUOTE_REQUEST,
        relatedId: { not: null },
      },
      select: { relatedId: true },
    }),
    prisma.quote.findMany({
      where: { tradesmanId },
      select: { quoteRequestId: true },
    }),
  ]);

  const requestIds = new Set(
    requestNotifications
      .map((notification) => notification.relatedId)
      .filter((value): value is string => Boolean(value)),
  );
  const quotedRequestIds = new Set(submittedQuotes.map((quote) => quote.quoteRequestId));
  const responseRate =
    requestIds.size === 0
      ? 0
      : Math.min(100, Math.round((quotedRequestIds.size / requestIds.size) * 100));

  await prisma.tradesmanProfile.update({
    where: { id: profile.id },
    data: { responseRate },
  });

  await syncProfessionalBadgesForProfile({
    profileId: profile.id,
    reason: "Professional response rate changed.",
  });

  return responseRate;
}

export async function syncProfessionalBadgesForProfile(params: {
  profileId: string;
  actorAdminId?: string;
  reason?: string;
}) {
  const [settings, metrics, existingBadges] = await Promise.all([
    getProfessionalBadgeSettingsSnapshot(),
    getProfessionalBadgeMetrics(params.profileId),
    prisma.professionalBadge.findMany({
      where: { profileId: params.profileId },
    }),
  ]);

  const eligibleCodes = new Set(getEligibleProfessionalBadgeCodes(settings, metrics));
  const existingByCode = new Map(
    existingBadges.map((badge) => [toCodeValue(badge.code), badge]),
  );
  const now = new Date();
  const snapshotText = toSnapshotText(metrics);

  for (const code of Object.values(PROFESSIONAL_BADGE_CODES)) {
    const existing = existingByCode.get(code);
    const shouldBeActive = eligibleCodes.has(code) && !existing?.isManuallyRemoved;

    if (shouldBeActive && (!existing || !existing.isActive)) {
      const saved = await prisma.professionalBadge.upsert({
        where: {
          profileId_code: {
            profileId: params.profileId,
            code: code as ProfessionalBadgeCode,
          },
        },
        update: {
          isActive: true,
          isManuallyRemoved: false,
          removedAt: null,
          removedById: null,
          removedReason: null,
          source: ProfessionalBadgeSource.AUTO,
          lastCalculatedAt: now,
        },
        create: {
          id: crypto.randomUUID(),
          profileId: params.profileId,
          code: code as ProfessionalBadgeCode,
          source: ProfessionalBadgeSource.AUTO,
          lastCalculatedAt: now,
        },
      });

      await prisma.professionalBadgeHistory.create({
        data: {
          id: crypto.randomUUID(),
          profileId: params.profileId,
          badgeId: saved.id,
          code: code as ProfessionalBadgeCode,
          action: ProfessionalBadgeHistoryAction.AWARDED,
          actorAdminId: params.actorAdminId,
          reason: params.reason ?? "Badge eligibility met automatically.",
          snapshotText,
        },
      });
      continue;
    }

    if (!shouldBeActive && existing?.isActive) {
      await prisma.professionalBadge.update({
        where: { id: existing.id },
        data: {
          isActive: false,
          removedAt: now,
          removedReason: existing.isManuallyRemoved
            ? existing.removedReason
            : params.reason ?? "Badge eligibility no longer met.",
          lastCalculatedAt: now,
        },
      });

      await prisma.professionalBadgeHistory.create({
        data: {
          id: crypto.randomUUID(),
          profileId: params.profileId,
          badgeId: existing.id,
          code: existing.code,
          action: ProfessionalBadgeHistoryAction.REMOVED,
          actorAdminId: params.actorAdminId,
          reason: existing.isManuallyRemoved
            ? existing.removedReason
            : params.reason ?? "Badge eligibility no longer met.",
          snapshotText,
        },
      });
    }
  }

  return getVisibleProfessionalBadgesForProfiles([params.profileId]);
}

export async function manuallyRemoveProfessionalBadge(params: {
  profileId: string;
  code: ProfessionalBadgeCodeValue;
  adminUserId: string;
  reason: string;
}) {
  if (!params.reason.trim()) {
    throw new AppError("Removal reason is required.", 400);
  }

  const existing = await prisma.professionalBadge.upsert({
    where: {
      profileId_code: {
        profileId: params.profileId,
        code: params.code as ProfessionalBadgeCode,
      },
    },
    update: {
      isActive: false,
      isManuallyRemoved: true,
      removedAt: new Date(),
      removedById: params.adminUserId,
      removedReason: params.reason.trim(),
    },
    create: {
      id: crypto.randomUUID(),
      profileId: params.profileId,
      code: params.code as ProfessionalBadgeCode,
      isActive: false,
      isManuallyRemoved: true,
      removedAt: new Date(),
      removedById: params.adminUserId,
      removedReason: params.reason.trim(),
      source: ProfessionalBadgeSource.MANUAL,
    },
  });

  await prisma.professionalBadgeHistory.create({
    data: {
      id: crypto.randomUUID(),
      profileId: params.profileId,
      badgeId: existing.id,
      code: params.code as ProfessionalBadgeCode,
      action: ProfessionalBadgeHistoryAction.REMOVED,
      actorAdminId: params.adminUserId,
      reason: params.reason.trim(),
    },
  });

  return existing;
}

export async function getVisibleProfessionalBadgesForProfiles(profileIds: string[]) {
  if (profileIds.length === 0) {
    return new Map<string, ProfessionalBadgeSummary[]>();
  }

  const [settings, badges] = await Promise.all([
    getProfessionalBadgeSettingsSnapshot(),
    prisma.professionalBadge.findMany({
      where: {
        profileId: { in: profileIds },
        isActive: true,
        isManuallyRemoved: false,
      },
    }),
  ]);

  const result = new Map<string, ProfessionalBadgeSummary[]>(
    profileIds.map((profileId) => [profileId, []]),
  );

  if (!settings.badgesEnabled) {
    return result;
  }

  for (const badge of badges) {
    if (
      (badge.code === ProfessionalBadgeCode.VERIFIED_PROFESSIONAL &&
        !settings.verifiedBadgeEnabled) ||
      (badge.code === ProfessionalBadgeCode.TOP_PROFESSIONAL && !settings.topBadgeEnabled)
    ) {
      continue;
    }

    result.get(badge.profileId)?.push(toProfessionalBadgeSummary(toCodeValue(badge.code)));
  }

  return result;
}

export async function listProfessionalBadgeHistory(take = 20) {
  return prisma.professionalBadgeHistory.findMany({
    include: {
      profile: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
