import { z } from "zod";

import { WALLET_TOPUP_PACKAGES } from "@/lib/wallets/wallet-topup-config";

const walletTopupAmountSchema = z.coerce
  .number()
  .refine((value) => Number.isFinite(value), "충전 금액은 숫자로 입력해 주세요.")
  .int("충전 금액은 정수여야 합니다.")
  .refine(
    (value) =>
      WALLET_TOPUP_PACKAGES.includes(value as (typeof WALLET_TOPUP_PACKAGES)[number]),
    `충전 금액은 ${WALLET_TOPUP_PACKAGES.join(" / ")} PHP 중 하나여야 합니다.`,
  );

export const walletTopupSchema = z.object({
  userId: z.string().cuid("충전할 전문가를 다시 선택해 주세요."),
  amount: walletTopupAmountSchema,
});

export const walletSelfTopupSchema = z.object({
  amount: walletTopupAmountSchema,
});

export const walletRefundSchema = z.object({
  walletTopupPaymentId: z.string().cuid("환불할 충전 기록을 다시 선택해 주세요."),
});
