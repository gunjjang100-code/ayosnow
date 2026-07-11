import { z } from "zod";

const dataImageUrlPattern = /^data:image\/(png|jpe?g|webp|gif);base64,/i;
const dataFileUrlPattern = /^data:[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*;base64,/i;

export const createConversationFromBookingSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required."),
});

export const sendConversationMessageSchema = z
  .object({
    content: z.string().trim().max(2000, "Message must be 2,000 characters or fewer.").default(""),
    imageDataUrl: z
      .string()
      .trim()
      .max(3_500_000, "Image data is too large.")
      .refine(
        (value) => value.length === 0 || dataImageUrlPattern.test(value),
        "Image format is invalid.",
      )
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    imageFileName: z
      .string()
      .trim()
      .max(120, "Image filename is too long.")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    fileDataUrl: z
      .string()
      .trim()
      .max(3_500_000, "File data is too large.")
      .refine(
        (value) => value.length === 0 || dataFileUrlPattern.test(value),
        "File format is invalid.",
      )
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    fileName: z
      .string()
      .trim()
      .max(120, "Filename is too long.")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    fileMimeType: z
      .string()
      .trim()
      .max(120, "File type information is too long.")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    fileSizeBytes: z.coerce
      .number()
      .int()
      .min(1)
      .max(2_500_000, "Files must be 2.5MB or smaller.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.content && !value.imageDataUrl && !value.fileDataUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Send at least one text message, image, or file.",
      });
    }

    if (value.fileDataUrl && (!value.fileName || !value.fileMimeType || !value.fileSizeBytes)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileDataUrl"],
        message: "File information is incomplete.",
      });
    }
  });

export const markConversationReadSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required."),
});

export const updateTypingIndicatorSchema = z.object({
  isTyping: z.boolean(),
});

export const selectQuoteSchema = z.object({
  quoteId: z.string().min(1, "quoteId is required."),
});

export const rescheduleBookingSchema = z.object({
  scheduledAt: z.string().datetime("Booking time format is invalid."),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["accepted", "in-progress", "completed"], {
    message: "Booking status value is invalid.",
  }),
});
