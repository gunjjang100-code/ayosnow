import { z } from "zod";
import {
  optionalDateSchema,
  optionalTextSchema,
  optionalUrlOrPathSchema,
  requiredUrlOrPathSchema,
} from "./_shared";

const adminBannerBaseSchema = z.object({
  titleKo: z.string().trim().min(2, "Legacy title must be at least 2 characters.").max(120),
  titleFil: z.string().trim().min(2, "Filipino title must be at least 2 characters.").max(120),
  descriptionKo: optionalTextSchema(200),
  descriptionFil: optionalTextSchema(200),
  ctaLabelKo: optionalTextSchema(60),
  ctaLabelFil: optionalTextSchema(60),
  imageUrl: requiredUrlOrPathSchema("Image URL is required.", "Image URL must start with http, https, or /"),
  linkUrl: optionalUrlOrPathSchema("Link URL must start with http, https, or /"),
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
        message: "End date cannot be earlier than start date.",
        path: ["endsAt"],
      });
    }
  });

export const adminBannerCreateSchema = validateBannerSchedule(adminBannerBaseSchema);

export const adminBannerUpdateSchema = validateBannerSchedule(
  adminBannerBaseSchema.partial().extend({
    id: z.string().min(1, "Banner ID is required for updates."),
  }),
);

export type AdminBannerCreateInput = z.infer<typeof adminBannerCreateSchema>;
export type AdminBannerUpdateInput = z.infer<typeof adminBannerUpdateSchema>;
