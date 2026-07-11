import { z } from "zod";

export const serviceSchema = z.object({
  title: z.string().trim().min(5, "Service title must be at least 5 characters.").max(80),
  categorySlug: z.string().trim().min(2).max(60),
  shortDescription: z
    .string()
    .trim()
    .min(20, "Service description must be at least 20 characters.")
    .max(300),
  basePriceMin: z.number().min(100),
  basePriceMax: z.number().min(100),
  durationMinutes: z.number().int().min(30).max(1440),
}).superRefine((value, context) => {
  if (value.basePriceMax < value.basePriceMin) {
    context.addIssue({
      code: "custom",
      message: "Maximum price cannot be lower than minimum price.",
      path: ["basePriceMax"],
    });
  }
});

export type ServiceInput = z.infer<typeof serviceSchema>;
