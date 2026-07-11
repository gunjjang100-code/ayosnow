import { z } from "zod";
import { optionalTextSchema } from "./_shared";

const categorySlugSchema = z
  .string()
  .trim()
  .min(2, "Category slug must be at least 2 characters.")
  .max(60)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Category slug can use lowercase letters, numbers, and hyphens only.",
  );

export const adminCategoryCreateSchema = z.object({
  slug: categorySlugSchema,
  nameKo: z.string().trim().min(2, "Legacy category name must be at least 2 characters.").max(80),
  nameFil: z.string().trim().min(2, "Category Filipino name must be at least 2 characters.").max(80),
  nameEn: z.string().trim().min(2, "Category English name must be at least 2 characters.").max(80),
  descriptionKo: z
    .string()
    .trim()
    .min(10, "Legacy category description must be at least 10 characters.")
    .max(300),
  descriptionFil: z
    .string()
    .trim()
    .min(10, "Category Filipino description must be at least 10 characters.")
    .max(300),
  descriptionEn: z
    .string()
    .trim()
    .min(10, "Category English description must be at least 10 characters.")
    .max(300),
  iconName: optionalTextSchema(60, "Icon name must be 60 characters or fewer."),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const adminCategoryUpdateSchema = adminCategoryCreateSchema.partial().extend({
  id: z.string().min(1, "Category ID is required for updates."),
});

export type AdminCategoryCreateInput = z.infer<typeof adminCategoryCreateSchema>;
export type AdminCategoryUpdateInput = z.infer<typeof adminCategoryUpdateSchema>;
