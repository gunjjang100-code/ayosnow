import { z } from "zod";
import { optionalDateSchema, optionalTextSchema } from "./_shared.ts";

export const tradesmanApprovalStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "NEEDS_CHANGES",
]);

const adminExpertApprovalBaseSchema = z.object({
  profileId: z.string().min(1, "Professional profile ID is required."),
  status: tradesmanApprovalStatusSchema,
  submittedNote: optionalTextSchema(1000),
  reviewNote: optionalTextSchema(1000),
  reviewedAt: optionalDateSchema(),
});

export const adminExpertApprovalCreateSchema = adminExpertApprovalBaseSchema.superRefine((value, context) => {
  const needsAdminReason = value.status === "REJECTED" || value.status === "NEEDS_CHANGES";
  if (needsAdminReason && !value.reviewNote?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["reviewNote"],
      message: "Admin review note is required when rejecting or requesting changes.",
    });
  }
});

export const adminExpertApprovalUpdateSchema = adminExpertApprovalBaseSchema.partial().extend({
  id: z.string().min(1, "Approval request ID is required for updates."),
});

export type AdminExpertApprovalCreateInput = z.infer<typeof adminExpertApprovalCreateSchema>;
export type AdminExpertApprovalUpdateInput = z.infer<typeof adminExpertApprovalUpdateSchema>;
