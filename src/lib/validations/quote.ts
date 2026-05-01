import { z } from "zod";

export const tradesmanQuoteSchema = z.object({
  quoteRequestId: z.string().trim().min(1, "견적 요청 정보가 비어 있습니다."),
  amount: z
    .number()
    .min(100, "견적 금액은 최소 PHP 100 이상으로 입력해 주세요.")
    .max(1_000_000, "견적 금액이 너무 큽니다."),
  // datetime-local 입력은 `YYYY-MM-DDTHH:mm` 형태로 들어온다.
  // 빈 값이면 방문 가능 시간이 없는 것으로 보고, 값이 있으면 기본 길이만 먼저 확인한다.
  visitDate: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(5, "방문 가능 시간 형식이 올바르지 않습니다.").optional(),
  ),
  message: z
    .string()
    .trim()
    .min(10, "고객에게 보낼 메시지는 10자 이상 적어 주세요.")
    .max(500, "메시지는 500자 이하로 입력해 주세요."),
});

export type TradesmanQuoteInput = z.infer<typeof tradesmanQuoteSchema>;
