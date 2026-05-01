import { z } from "zod";

export const tradesmanSkillCategorySchema = z.object({
  categorySlugs: z
    .array(z.string().trim().min(1))
    .min(1, "전문 기술 카테고리를 최소 1개 이상 선택해 주세요.")
    .max(12, "전문 기술 카테고리는 최대 12개까지 선택할 수 있습니다."),
});

export type TradesmanSkillCategoryInput = z.infer<
  typeof tradesmanSkillCategorySchema
>;
