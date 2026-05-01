import { z } from "zod";
import { optionalTextSchema } from "./_shared";

const categorySlugSchema = z
  .string()
  .trim()
  .min(2, "카테고리 주소는 2자 이상이어야 합니다.")
  .max(60)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "카테고리 주소는 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
  );

export const adminCategoryCreateSchema = z.object({
  slug: categorySlugSchema,
  nameKo: z.string().trim().min(2, "한국어 카테고리 이름은 2자 이상이어야 합니다.").max(80),
  nameFil: z.string().trim().min(2, "필리핀어 카테고리 이름은 2자 이상이어야 합니다.").max(80),
  nameEn: z.string().trim().min(2, "영어 카테고리 이름은 2자 이상이어야 합니다.").max(80),
  descriptionKo: z
    .string()
    .trim()
    .min(10, "한국어 카테고리 설명은 10자 이상 적어 주세요.")
    .max(300),
  descriptionFil: z
    .string()
    .trim()
    .min(10, "필리핀어 카테고리 설명은 10자 이상 적어 주세요.")
    .max(300),
  descriptionEn: z
    .string()
    .trim()
    .min(10, "영어 카테고리 설명은 10자 이상 적어 주세요.")
    .max(300),
  iconName: optionalTextSchema(60, "아이콘 이름은 60자 이하여야 합니다."),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const adminCategoryUpdateSchema = adminCategoryCreateSchema.partial().extend({
  id: z.string().min(1, "수정할 카테고리 ID가 필요합니다."),
});

export type AdminCategoryCreateInput = z.infer<typeof adminCategoryCreateSchema>;
export type AdminCategoryUpdateInput = z.infer<typeof adminCategoryUpdateSchema>;
