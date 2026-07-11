import { z } from "zod";

export const adminWalletActionSchema = z.object({
  action: z.enum(["add-credit", "deduct-credit"]),
  amount: z.coerce
    .number()
    .int("Amount must be a whole number.")
    .positive("Amount must be at least 1 PHP."),
});
