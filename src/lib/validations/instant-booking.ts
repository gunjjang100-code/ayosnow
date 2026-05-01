import { z } from "zod";

export const instantBookingSchema = z.object({
  serviceSlug: z
    .string()
    .trim()
    .min(3, "서비스 주소가 너무 짧습니다.")
    .max(120, "서비스 주소가 너무 깁니다."),
});

export type InstantBookingInput = z.infer<typeof instantBookingSchema>;
