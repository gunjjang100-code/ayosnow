import { z } from "zod";

import { WALLET_TOPUP_PACKAGES } from "../wallets/wallet-topup-config.ts";

const walletTopupAmountSchema = z.coerce
  .number()
  .refine((value) => Number.isFinite(value), "Top-up amount must be a number.")
  .int("Top-up amount must be a whole number.")
  .refine(
    (value) =>
      WALLET_TOPUP_PACKAGES.includes(value as (typeof WALLET_TOPUP_PACKAGES)[number]),
    `Top-up amount must be one of ${WALLET_TOPUP_PACKAGES.join(" / ")} PHP.`,
  );

export const walletTopupSchema = z.object({
  userId: z.string().cuid("Please select the professional to top up again."),
  amount: walletTopupAmountSchema,
});

export const walletSelfTopupSchema = z.object({
  amount: walletTopupAmountSchema,
  acceptedPaymentPolicy: z.boolean().default(false),
});

export const walletRefundSchema = z.object({
  walletTopupPaymentId: z.string().cuid("Please select the top-up record to refund again."),
});
