import { z } from "zod";

export const accountDeletionRequestSchema = z.object({
  reason: z.string().trim().max(1000, "Reason must be 1,000 characters or fewer.").optional(),
  confirmText: z.literal("DELETE", {
    error: "Type DELETE to confirm this account deletion request.",
  }),
});

export const adminAccountDeletionReviewSchema = z.object({
  requestId: z.string().trim().min(1, "Request ID is required."),
  status: z.enum(["COMPLETED", "CANCELLED"]),
  reviewNote: z.string().trim().max(1000, "Review note must be 1,000 characters or fewer.").optional(),
});

export type AccountDeletionRequestInput = z.infer<typeof accountDeletionRequestSchema>;
export type AdminAccountDeletionReviewInput = z.infer<typeof adminAccountDeletionReviewSchema>;
