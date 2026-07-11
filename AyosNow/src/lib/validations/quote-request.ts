import { z } from "zod";

function normalizeOptionalDateInput(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  if (trimmedValue === "") {
    return undefined;
  }

  const dateParts =
    trimmedValue.match(/^(\d{4})(\d{2})(\d{2})$/) ??
    trimmedValue.match(/^(\d{4})[-/.]\s*(\d{1,2})[-/.]\s*(\d{1,2})\.?$/);
  if (!dateParts) {
    return trimmedValue;
  }

  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  const normalizedDate = `${dateParts[1]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsedDate = new Date(`${normalizedDate}T00:00:00.000Z`);

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() + 1 !== month ||
    parsedDate.getUTCDate() !== day
  ) {
    return trimmedValue;
  }

  return normalizedDate;
}

export const quoteRequestSchema = z.object({
  categorySlug: z
    .string()
    .trim()
    .min(2, "Choose a service type first.")
    .max(60, "Service type value is too long."),
  title: z
    .string()
    .trim()
    .min(2, "Request title must be at least 2 characters.")
    .max(80, "Request title must be 80 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters.")
    .max(1000, "Description must be 1000 characters or fewer."),
  city: z
    .string()
    .trim()
    .min(2, "Enter a city or area with at least 2 characters.")
    .max(80, "Location is too long."),
  addressLine: z
    .string()
    .trim()
    .min(1, "Enter at least 1 character for the detailed address.")
    .max(160, "Detailed address must be 160 characters or fewer."),
  budgetMin: z.number().min(100, "Budget must be at least PHP 100.").optional(),
  budgetMax: z.number().min(100, "Budget must be at least PHP 100.").optional(),
  // 날짜 입력이 비어 있으면 undefined로 넘기고,
  // 값이 있으면 사람이 자주 쓰는 YYYYMMDD / YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD를
  // 서버 저장용 YYYY-MM-DD로 통일한 뒤 실제 날짜인지 확인한다.
  targetDate: z.preprocess(
    normalizeOptionalDateInput,
    z.string().trim().date("Preferred date format is invalid.").optional(),
  ),
}).superRefine((value, context) => {
  if (value.budgetMin && value.budgetMax && value.budgetMax < value.budgetMin) {
    context.addIssue({
      code: "custom",
      message: "Maximum budget cannot be lower than minimum budget.",
      path: ["budgetMax"],
    });
  }
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
