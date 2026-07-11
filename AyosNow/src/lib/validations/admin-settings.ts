import { z } from "zod";

export const referralSettingUpdateSchema = z.object({
  rewardCredits: z.coerce
    .number()
    .int("Referral reward must be a whole number.")
    .min(0, "Referral reward cannot be lower than 0.")
    .max(10000, "Referral reward is too large."),
  isActive: z.boolean(),
});

export type ReferralSettingUpdateInput = z.infer<typeof referralSettingUpdateSchema>;
