import { z } from "zod";

export const adminWalletActionSchema = z.object({
  action: z.enum(["add-credit", "deduct-credit"]),
  amount: z.coerce
    .number()
    .int("금액은 정수여야 합니다.")
    .positive("금액은 1 PHP 이상이어야 합니다."),
});
