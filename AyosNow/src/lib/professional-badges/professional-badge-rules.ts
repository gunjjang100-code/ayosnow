export const PROFESSIONAL_BADGE_CODES = {
  verified: "VERIFIED_PROFESSIONAL",
  top: "TOP_PROFESSIONAL",
} as const;

export type ProfessionalBadgeCodeValue =
  (typeof PROFESSIONAL_BADGE_CODES)[keyof typeof PROFESSIONAL_BADGE_CODES];

export interface ProfessionalBadgeSummary {
  code: ProfessionalBadgeCodeValue;
  label: string;
  description: string;
  tone: "verified" | "top";
}

export interface ProfessionalBadgeSettingsSnapshot {
  badgesEnabled: boolean;
  verifiedBadgeEnabled: boolean;
  topBadgeEnabled: boolean;
  topMinCompletedBookings: number;
  topMinAverageRating: number;
  topMinResponseRate: number;
  topMaxCancellationRate: number;
}

export interface ProfessionalBadgeMetricsSnapshot {
  isVerified: boolean;
  identityVerifiedAt: Date | string | null;
  completedBookings: number;
  averageRating: number;
  responseRate: number;
  cancellationRate: number;
  activePenaltyCount: number;
}

export const DEFAULT_PROFESSIONAL_BADGE_SETTINGS: ProfessionalBadgeSettingsSnapshot = {
  badgesEnabled: true,
  verifiedBadgeEnabled: true,
  topBadgeEnabled: true,
  topMinCompletedBookings: 10,
  topMinAverageRating: 4.7,
  topMinResponseRate: 90,
  topMaxCancellationRate: 5,
};

export const PROFESSIONAL_BADGE_DEFINITIONS: Record<
  ProfessionalBadgeCodeValue,
  ProfessionalBadgeSummary
> = {
  VERIFIED_PROFESSIONAL: {
    code: "VERIFIED_PROFESSIONAL",
    label: "Verified Professional",
    description: "Admin-approved professional with completed identity review.",
    tone: "verified",
  },
  TOP_PROFESSIONAL: {
    code: "TOP_PROFESSIONAL",
    label: "Top Professional",
    description: "High-performing professional with strong completion, rating, and response metrics.",
    tone: "top",
  },
};

export function isVerifiedProfessionalEligible(
  settings: ProfessionalBadgeSettingsSnapshot,
  metrics: ProfessionalBadgeMetricsSnapshot,
) {
  return Boolean(
    settings.badgesEnabled &&
      settings.verifiedBadgeEnabled &&
      metrics.isVerified &&
      metrics.identityVerifiedAt,
  );
}

export function isTopProfessionalEligible(
  settings: ProfessionalBadgeSettingsSnapshot,
  metrics: ProfessionalBadgeMetricsSnapshot,
) {
  return Boolean(
    settings.badgesEnabled &&
      settings.topBadgeEnabled &&
      isVerifiedProfessionalEligible(settings, metrics) &&
      metrics.completedBookings >= settings.topMinCompletedBookings &&
      metrics.averageRating >= settings.topMinAverageRating &&
      metrics.responseRate >= settings.topMinResponseRate &&
      metrics.cancellationRate <= settings.topMaxCancellationRate &&
      metrics.activePenaltyCount === 0,
  );
}

export function getEligibleProfessionalBadgeCodes(
  settings: ProfessionalBadgeSettingsSnapshot,
  metrics: ProfessionalBadgeMetricsSnapshot,
): ProfessionalBadgeCodeValue[] {
  const codes: ProfessionalBadgeCodeValue[] = [];

  if (isVerifiedProfessionalEligible(settings, metrics)) {
    codes.push(PROFESSIONAL_BADGE_CODES.verified);
  }

  if (isTopProfessionalEligible(settings, metrics)) {
    codes.push(PROFESSIONAL_BADGE_CODES.top);
  }

  return codes;
}

export function toProfessionalBadgeSummary(
  code: ProfessionalBadgeCodeValue,
): ProfessionalBadgeSummary {
  return PROFESSIONAL_BADGE_DEFINITIONS[code];
}
