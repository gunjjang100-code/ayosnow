import { z } from "zod";

export const instantBookingSchema = z.object({
  serviceSlug: z
    .string()
    .trim()
    .min(3, "Service address is too short.")
    .max(120, "Service address is too long."),
});

export type InstantBookingInput = z.infer<typeof instantBookingSchema>;
