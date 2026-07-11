import { z } from "zod";
import {
  optionalDateSchema,
  optionalIdSchema,
  optionalTextSchema,
  optionalUrlOrPathSchema,
} from "./_shared";

export const oneOutCaseStatusSchema = z.enum([
  "OPEN",
  "UNDER_REVIEW",
  "STRIKE_APPLIED",
  "SUSPENDED",
  "RESOLVED",
  "DISMISSED",
]);

const adminOneOutBaseSchema = z.object({
  profileId: z.string().min(1, "Professional profile ID is required."),
  bookingId: optionalIdSchema("Booking ID is required."),
  disputeId: optionalIdSchema("Dispute ID is required."),
  status: oneOutCaseStatusSchema.default("OPEN"),
  reason: z.string().trim().min(10, "Suspension reason must be at least 10 characters.").max(1000),
  evidenceUrl: optionalUrlOrPathSchema("Evidence URL must start with http, https, or /"),
  strikeCountApplied: z.coerce.number().int().min(1).max(10).default(1),
  suspensionUntil: optionalDateSchema(),
  adminNote: optionalTextSchema(2000),
  handledAt: optionalDateSchema(),
});

const validateOneOutCreate = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((value, context) => {
    const oneOutValue = value as {
      bookingId?: string;
      disputeId?: string;
    };

    if (!oneOutValue.bookingId && !oneOutValue.disputeId) {
      context.addIssue({
        code: "custom",
        message: "Either a booking ID or dispute ID is required.",
        path: ["bookingId"],
      });
    }
  });

export const adminOneOutCreateSchema = validateOneOutCreate(adminOneOutBaseSchema);

export const adminOneOutUpdateSchema = adminOneOutBaseSchema.partial().extend({
  id: z.string().min(1, "One-out case ID is required for updates."),
});

export type AdminOneOutCreateInput = z.infer<typeof adminOneOutCreateSchema>;
export type AdminOneOutUpdateInput = z.infer<typeof adminOneOutUpdateSchema>;
