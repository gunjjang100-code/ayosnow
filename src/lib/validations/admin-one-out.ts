import { z } from "zod";
import {
  optionalDateSchema,
  optionalIdSchema,
  optionalTextSchema,
  optionalUrlOrPathSchema,
} from "./_shared";

export const oneOutCaseStatusSchema = z.enum([
  "OPEN",
  "UNDER_REVIEW",
  "STRIKE_APPLIED",
  "SUSPENDED",
  "RESOLVED",
  "DISMISSED",
]);

const adminOneOutBaseSchema = z.object({
  profileId: z.string().min(1, "전문가 프로필 ID가 필요합니다."),
  bookingId: optionalIdSchema("예약 ID를 입력해 주세요."),
  disputeId: optionalIdSchema("분쟁 ID를 입력해 주세요."),
  status: oneOutCaseStatusSchema.default("OPEN"),
  reason: z.string().trim().min(10, "정지 사유는 10자 이상이어야 합니다.").max(1000),
  evidenceUrl: optionalUrlOrPathSchema("증거 주소는 http, https, 또는 / 로 시작해야 합니다."),
  strikeCountApplied: z.coerce.number().int().min(1).max(10).default(1),
  suspensionUntil: optionalDateSchema(),
  adminNote: optionalTextSchema(2000),
  handledAt: optionalDateSchema(),
});

const validateOneOutCreate = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((value, context) => {
    const oneOutValue = value as {
      bookingId?: string;
      disputeId?: string;
    };

    if (!oneOutValue.bookingId && !oneOutValue.disputeId) {
      context.addIssue({
        code: "custom",
        message: "예약 또는 분쟁 ID 중 하나는 반드시 입력해야 합니다.",
        path: ["bookingId"],
      });
    }
  });

export const adminOneOutCreateSchema = validateOneOutCreate(adminOneOutBaseSchema);

export const adminOneOutUpdateSchema = adminOneOutBaseSchema.partial().extend({
  id: z.string().min(1, "수정할 원아웃 사례 ID가 필요합니다."),
});

export type AdminOneOutCreateInput = z.infer<typeof adminOneOutCreateSchema>;
export type AdminOneOutUpdateInput = z.infer<typeof adminOneOutUpdateSchema>;
