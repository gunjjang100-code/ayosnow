import { z } from "zod";

export const tradesmanSkillCategorySchema = z.object({
  categorySlugs: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one professional skill category.")
    .max(12, "You can select up to 12 professional skill categories."),
});

export type TradesmanSkillCategoryInput = z.infer<
  typeof tradesmanSkillCategorySchema
>;
