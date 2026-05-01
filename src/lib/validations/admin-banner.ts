import { z } from "zod";
import {
  optionalDateSchema,
  optionalTextSchema,
  optionalUrlOrPathSchema,
  requiredUrlOrPathSchema,
} from "./_shared";

const adminBannerBaseSchema = z.object({
  titleKo: z.string().trim().min(2, "한국어 제목은 2자 이상이어야 합니다.").max(120),
  titleFil: z.string().trim().min(2, "필리핀어 제목은 2자 이상이어야 합니다.").max(120),
  descriptionKo: optionalTextSchema(200),
  descriptionFil: optionalTextSchema(200),
  ctaLabelKo: optionalTextSchema(60),
  ctaLabelFil: optionalTextSchema(60),
  imageUrl: requiredUrlOrPathSchema("이미지 주소를 입력해 주세요.", "이미지 주소는 http, https, 또는 / 로 시작해야 합니다."),
  linkUrl: optionalUrlOrPathSchema("링크는 http, https, 또는 / 로 시작해야 합니다."),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).default("DRAFT"),
  displayOrder: z.coerce.number().int().min(0).default(0),
  startsAt: optionalDateSchema(),
  endsAt: optionalDateSchema(),
});

const validateBannerSchedule = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((value, context) => {
    const bannerValue = value as {
      endsAt?: Date;
      startsAt?: Date;
    };

    if (bannerValue.endsAt && bannerValue.startsAt && bannerValue.endsAt < bannerValue.startsAt) {
      context.addIssue({
        code: "custom",
        message: "종료일은 시작일보다 빠를 수 없습니다.",
        path: ["endsAt"],
      });
    }
  });

export const adminBannerCreateSchema = validateBannerSchedule(adminBannerBaseSchema);

export const adminBannerUpdateSchema = validateBannerSchedule(
  adminBannerBaseSchema.partial().extend({
    id: z.string().min(1, "수정할 배너 ID가 필요합니다."),
  }),
);

export type AdminBannerCreateInput = z.infer<typeof adminBannerCreateSchema>;
export type AdminBannerUpdateInput = z.infer<typeof adminBannerUpdateSchema>;
