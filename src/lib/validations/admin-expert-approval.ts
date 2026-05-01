import { z } from "zod";
import { optionalDateSchema, optionalTextSchema } from "./_shared";

export const tradesmanApprovalStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "NEEDS_CHANGES",
]);

export const adminExpertApprovalCreateSchema = z.object({
  profileId: z.string().min(1, "전문가 프로필 ID가 필요합니다."),
  status: tradesmanApprovalStatusSchema,
  submittedNote: optionalTextSchema(1000),
  reviewNote: optionalTextSchema(1000),
  reviewedAt: optionalDateSchema(),
});

export const adminExpertApprovalUpdateSchema = adminExpertApprovalCreateSchema.partial().extend({
  id: z.string().min(1, "수정할 승인 요청 ID가 필요합니다."),
});

export type AdminExpertApprovalCreateInput = z.infer<typeof adminExpertApprovalCreateSchema>;
export type AdminExpertApprovalUpdateInput = z.infer<typeof adminExpertApprovalUpdateSchema>;
