import { z } from "zod";
import { optionalDateSchema } from "./_shared";

const adminNoticeBaseSchema = z.object({
  titleKo: z.string().trim().min(2, "Legacy title must be at least 2 characters.").max(120),
  titleFil: z.string().trim().min(2, "Filipino title must be at least 2 characters.").max(120),
  contentKo: z.string().trim().min(10, "Notice content must be at least 10 characters.").max(4000),
  contentFil: z.string().trim().min(10, "Notice content must be at least 10 characters.").max(4000),
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
        message: "Expiration date cannot be earlier than publish date.",
        path: ["expiresAt"],
      });
    }
  });

export const adminNoticeCreateSchema = validateNoticeSchedule(adminNoticeBaseSchema);

export const adminNoticeUpdateSchema = validateNoticeSchedule(
  adminNoticeBaseSchema.partial().extend({
    id: z.string().min(1, "Notice ID is required for updates."),
  }),
);

export type AdminNoticeCreateInput = z.infer<typeof adminNoticeCreateSchema>;
export type AdminNoticeUpdateInput = z.infer<typeof adminNoticeUpdateSchema>;
