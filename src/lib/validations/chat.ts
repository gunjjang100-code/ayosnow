import { z } from "zod";

const dataImageUrlPattern = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

export const createConversationFromBookingSchema = z.object({
  bookingId: z.string().min(1, "bookingId가 필요합니다."),
});

export const sendConversationMessageSchema = z
  .object({
    content: z.string().trim().max(2000, "메시지는 2,000자 이하로 보내 주세요.").default(""),
    imageDataUrl: z
      .string()
      .trim()
      .max(2_500_000, "이미지 데이터가 너무 큽니다.")
      .refine(
        (value) => value.length === 0 || dataImageUrlPattern.test(value),
        "이미지 형식이 올바르지 않습니다.",
      )
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
  })
  .superRefine((value, ctx) => {
    if (!value.content && !value.imageDataUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "텍스트나 이미지를 하나 이상 보내야 합니다.",
      });
    }
  });

export const markConversationReadSchema = z.object({
  conversationId: z.string().min(1, "conversationId가 필요합니다."),
});

export const selectQuoteSchema = z.object({
  quoteId: z.string().min(1, "quoteId가 필요합니다."),
});

export const rescheduleBookingSchema = z.object({
  scheduledAt: z.string().datetime("예약 시간 형식이 올바르지 않습니다."),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["accepted", "in-progress", "completed"], {
    message: "예약 상태 값이 올바르지 않습니다.",
  }),
});
