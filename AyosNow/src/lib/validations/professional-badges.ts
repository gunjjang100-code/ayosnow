import { z } from "zod";

export const professionalBadgeSettingsSchema = z.object({
  badgesEnabled: z.boolean(),
  verifiedBadgeEnabled: z.boolean(),
  topBadgeEnabled: z.boolean(),
  topMinCompletedBookings: z.coerce.number().int().min(0).max(10000),
  topMinAverageRating: z.coerce.number().min(0).max(5),
  topMinResponseRate: z.coerce.number().int().min(0).max(100),
  topMaxCancellationRate: z.coerce.number().int().min(0).max(100),
});

export const professionalBadgeManualRemoveSchema = z.object({
  profileId: z.string().min(1),
  code: z.enum(["VERIFIED_PROFESSIONAL", "TOP_PROFESSIONAL"]),
  reason: z.string().trim().min(3).max(500),
});
