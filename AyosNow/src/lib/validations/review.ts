import { z } from "zod";

import { optionalUrlOrPathSchema } from "./_shared.ts";

export const bookingReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int("Choose a rating from 1 to 5.")
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating must be at most 5."),
  comment: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters.")
    .max(1000, "Review must be 1000 characters or fewer."),
  photoUrl: optionalUrlOrPathSchema("Photo URL must start with http, https, or /."),
});

export type BookingReviewInput = z.infer<typeof bookingReviewSchema>;
