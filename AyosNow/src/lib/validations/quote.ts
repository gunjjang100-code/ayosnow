import { z } from "zod";

export const tradesmanQuoteSchema = z.object({
  quoteRequestId: z.string().trim().min(1, "Quote request information is missing."),
  amount: z
    .number()
    .min(100, "Quote amount must be at least PHP 100.")
    .max(1_000_000, "Quote amount is too high."),
  // datetime-local 입력은 `YYYY-MM-DDTHH:mm` 형태로 들어온다.
  // 빈 값이면 방문 가능 시간이 없는 것으로 보고, 값이 있으면 기본 길이만 먼저 확인한다.
  visitDate: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(5, "Visit time format is invalid.").optional(),
  ),
  message: z
    .string()
    .trim()
    .min(10, "Message to the customer must be at least 10 characters.")
    .max(500, "Message must be 500 characters or fewer."),
});

export type TradesmanQuoteInput = z.infer<typeof tradesmanQuoteSchema>;
