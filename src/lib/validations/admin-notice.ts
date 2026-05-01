import { z } from "zod";
import { optionalDateSchema } from "./_shared";

const adminNoticeBaseSchema = z.object({
  titleKo: z.string().trim().min(2, "한국어 제목은 2자 이상이어야 합니다.").max(120),
  titleFil: z.string().trim().min(2, "필리핀어 제목은 2자 이상이어야 합니다.").max(120),
  contentKo: z.string().trim().min(10, "공지 내용은 10자 이상이어야 합니다.").max(4000),
  contentFil: z.string().trim().min(10, "공지 내용은 10자 이상이어야 합니다.").max(4000),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).default("DRAFT"),
  isPinned: z.boolean().default(false),
  publishedAt: optionalDateSchema(),
  expiresAt: optionalDateSchema(),
});

const validateNoticeSchedule = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((value, context) => {
    const noticeValue = value as {
      expiresAt?: Date;
      publishedAt?: Date;
    };

    if (noticeValue.expiresAt && noticeValue.publishedAt && noticeValue.expiresAt < noticeValue.publishedAt) {
      context.addIssue({
        code: "custom",
        message: "만료일은 게시일보다 빠를 수 없습니다.",
        path: ["expiresAt"],
      });
    }
  });

export const adminNoticeCreateSchema = validateNoticeSchedule(adminNoticeBaseSchema);

export const adminNoticeUpdateSchema = validateNoticeSchedule(
  adminNoticeBaseSchema.partial().extend({
    id: z.string().min(1, "수정할 공지 ID가 필요합니다."),
  }),
);

export type AdminNoticeCreateInput = z.infer<typeof adminNoticeCreateSchema>;
export type AdminNoticeUpdateInput = z.infer<typeof adminNoticeUpdateSchema>;
