import { z } from "zod";

export const quoteRequestSchema = z.object({
  categorySlug: z
    .string()
    .trim()
    .min(2, "서비스 종류를 먼저 선택해 주세요.")
    .max(60, "서비스 종류 값이 너무 깁니다."),
  title: z
    .string()
    .trim()
    .min(2, "요청 제목은 2자 이상으로 입력해 주세요.")
    .max(80, "요청 제목은 80자 이하로 입력해 주세요."),
  description: z
    .string()
    .trim()
    .min(2, "상세 설명은 2자 이상으로 적어 주세요.")
    .max(1000, "상세 설명은 1000자 이하로 입력해 주세요."),
  city: z
    .string()
    .trim()
    .min(2, "도시 또는 지역을 2자 이상 입력해 주세요.")
    .max(80, "위치 정보가 너무 깁니다."),
  addressLine: z
    .string()
    .trim()
    .min(1, "상세 주소는 1자 이상 입력해 주세요.")
    .max(160, "상세 주소는 160자 이하로 입력해 주세요."),
  budgetMin: z.number().min(100, "예산은 최소 PHP 100 이상으로 입력해 주세요.").optional(),
  budgetMax: z.number().min(100, "예산은 최소 PHP 100 이상으로 입력해 주세요.").optional(),
  // 날짜 입력이 비어 있으면 undefined로 넘기고,
  // 값이 있으면 브라우저 date input 형식(YYYY-MM-DD)인지 확인한다.
  targetDate: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().date("희망 날짜 형식이 올바르지 않습니다.").optional(),
  ),
}).superRefine((value, context) => {
  if (value.budgetMin && value.budgetMax && value.budgetMax < value.budgetMin) {
    context.addIssue({
      code: "custom",
      message: "최대 예산은 최소 예산보다 작을 수 없습니다.",
      path: ["budgetMax"],
    });
  }
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
