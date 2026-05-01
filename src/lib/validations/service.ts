import { z } from "zod";

export const serviceSchema = z.object({
  title: z.string().trim().min(5, "서비스 제목은 5자 이상이어야 합니다.").max(80),
  categorySlug: z.string().trim().min(2).max(60),
  shortDescription: z
    .string()
    .trim()
    .min(20, "서비스 설명은 20자 이상 적어 주세요.")
    .max(300),
  basePriceMin: z.number().min(100),
  basePriceMax: z.number().min(100),
  durationMinutes: z.number().int().min(30).max(1440),
}).superRefine((value, context) => {
  if (value.basePriceMax < value.basePriceMin) {
    context.addIssue({
      code: "custom",
      message: "최대 금액은 최소 금액보다 작을 수 없습니다.",
      path: ["basePriceMax"],
    });
  }
});

export type ServiceInput = z.infer<typeof serviceSchema>;
