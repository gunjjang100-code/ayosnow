import {
  UserRole,
  WalletTopupProvider,
  WalletTopupStatus,
} from "@prisma/client";
import crypto from "node:crypto";

import { AppError } from "@/lib/errors/app-error";
import { getAppUrl, paymongoRequest } from "@/lib/paymongo/paymongo-client";
import { prisma } from "@/lib/prisma";
import {
  isSupportedWalletTopupAmount,
  WALLET_TOPUP_PACKAGES,
  WALLET_TOPUP_PENDING_WINDOW_MINUTES,
} from "@/lib/wallets/wallet-topup-config";
import {
  creditWalletFromTopup,
  ensureWalletForUser,
  refundWalletCredits,
} from "@/lib/wallets/wallet-service";

type PaymongoCheckoutSessionResponse = {
  data: {
    id: string;
    attributes: {
      checkout_url: string;
      payment_method_types: string[];
      status: string;
    };
  };
};

export type WalletTopupAdminItem = {
  id: string;
  fullName: string;
  wallet: {
    balance: number;
  } | null;
  walletTopupPayments: {
    id: string;
    amount: number;
    status: WalletTopupStatus;
    createdAt: Date;
  }[];
};

export async function createWalletTopupCheckoutSession(params: {
  userId: string;
  fullName: string;
  email: string;
  amount: number;
}) {
  if (!isSupportedWalletTopupAmount(params.amount)) {
    throw new AppError(
      `충전 금액은 ${WALLET_TOPUP_PACKAGES.join(" / ")} PHP 중 하나여야 합니다.`,
      400,
    );
  }

  await ensureWalletForUser({
    userId: params.userId,
  });

  const topupPayment = await prisma.$transaction(async (tx) => {
    // 중요한 부분:
    // 같은 사용자 + 같은 금액 충전 요청은 한 번에 하나만 준비되도록 잠근다.
    // 연타나 중복 클릭이 와도 여기서 한 줄로 세워서 같은 PENDING 세션을 재사용하거나,
    // 아직 준비 중이면 "잠시 후 다시"로 막을 수 있게 한다.
    await tx.$queryRaw<{ locked: number }[]>`
      SELECT 1::int AS locked
      FROM pg_advisory_xact_lock(hashtext(${`wallet-topup:${params.userId}:${params.amount}`}))
    `;

    const existingPendingPayment = await tx.walletTopupPayment.findFirst({
      where: {
        userId: params.userId,
        amount: params.amount,
        provider: WalletTopupProvider.PAYMONGO,
        status: WalletTopupStatus.PENDING,
        createdAt: {
          gte: new Date(Date.now() - WALLET_TOPUP_PENDING_WINDOW_MINUTES * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingPendingPayment?.checkoutUrl) {
      return existingPendingPayment;
    }

    if (existingPendingPayment) {
      throw new AppError(
        "같은 충전 세션을 준비 중입니다. 잠시 후 다시 시도해 주세요.",
        409,
      );
    }

    return tx.walletTopupPayment.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        provider: WalletTopupProvider.PAYMONGO,
        status: WalletTopupStatus.PENDING,
        idempotencyKey: crypto.randomUUID(),
      },
    });
  });

  if (topupPayment.checkoutUrl) {
    return topupPayment;
  }

  const appUrl = getAppUrl();
  const metadata = {
    wallet_topup_payment_id: topupPayment.id,
    user_id: params.userId,
    amount_php: String(params.amount),
  };

  try {
    const result = await paymongoRequest<PaymongoCheckoutSessionResponse>(
      "/checkout_sessions",
      {
        method: "POST",
        body: JSON.stringify({
          data: {
            attributes: {
              billing: {
                name: params.fullName,
                email: params.email,
              },
              cancel_url: `${appUrl}/settlements?topup=cancelled`,
              success_url: `${appUrl}/settlements?topup=processing`,
              payment_method_types: ["gcash", "paymaya", "card"],
              line_items: [
                {
                  currency: "PHP",
                  amount: params.amount * 100,
                  name: `AyosNow 크레딧 ${params.amount} PHP`,
                  quantity: 1,
                  description: "전문가 견적 제출용 크레딧 충전",
                },
              ],
              description: "AyosNow 전문가 크레딧 충전",
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              metadata,
            },
          },
        }),
      },
    );

    return prisma.walletTopupPayment.update({
      where: { id: topupPayment.id },
      data: {
        checkoutSessionId: result.data.id,
        checkoutUrl: result.data.attributes.checkout_url,
      },
    });
  } catch (error) {
    await prisma.walletTopupPayment.update({
      where: { id: topupPayment.id },
      data: {
        status: WalletTopupStatus.FAILED,
        failureMessage:
          error instanceof Error ? error.message : "체크아웃 세션 생성에 실패했습니다.",
      },
    });

    throw error;
  }
}

export async function finalizeWalletTopupFromWebhook(params: {
  checkoutSessionId: string;
  eventId: string;
  providerPaymentId?: string | null;
}) {
  const payment = await prisma.walletTopupPayment.findUnique({
    where: { checkoutSessionId: params.checkoutSessionId },
  });

  if (!payment) {
    throw new AppError("해당 체크아웃 충전 기록을 찾지 못했습니다.", 404);
  }

  if (payment.refundedAt) {
    return payment;
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<{ locked: number }[]>`
      SELECT 1::int AS locked
      FROM pg_advisory_xact_lock(hashtext(${`wallet-topup-webhook:${payment.id}`}))
    `;

    const latest = await tx.walletTopupPayment.findUnique({
      where: { id: payment.id },
    });

    if (!latest) {
      throw new AppError("충전 기록을 찾지 못했습니다.", 404);
    }

    if (latest.creditedAt) {
      // 중요한 부분:
      // 이미 creditedAt이 있으면 이 웹훅은 재전송이므로 바로 끝낸다.
      // 아래 creditWalletFromTopup도 unique referenceKey로 한 번 더 막는다.
      return latest;
    }

    const referenceKey = `wallet-topup:${latest.id}`;

    await creditWalletFromTopup({
      userId: latest.userId,
      amount: latest.amount,
      walletTopupPaymentId: latest.id,
      referenceKey,
      tx,
    });

    return tx.walletTopupPayment.update({
      where: { id: latest.id },
      data: {
        status: WalletTopupStatus.PAID,
        paidAt: latest.paidAt ?? new Date(),
        creditedAt: latest.creditedAt ?? new Date(),
        paidEventId: latest.paidEventId ?? params.eventId,
        providerPaymentId: latest.providerPaymentId ?? params.providerPaymentId ?? null,
      },
    });
  });
}

export async function createManualAdminTopup(params: {
  userId: string;
  amount: number;
}) {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AppError("충전 금액은 1 이상이어야 합니다.", 400);
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<{ locked: number }[]>`
      SELECT 1::int AS locked
      FROM pg_advisory_xact_lock(hashtext(${`wallet-manual-topup:${params.userId}`}))
    `;

    const payment = await tx.walletTopupPayment.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        provider: WalletTopupProvider.MANUAL_ADMIN,
        status: WalletTopupStatus.PAID,
        idempotencyKey: crypto.randomUUID(),
        paidAt: new Date(),
      },
    });

    await creditWalletFromTopup({
      userId: params.userId,
      amount: params.amount,
      walletTopupPaymentId: payment.id,
      referenceKey: `wallet-topup:${payment.id}`,
      memo: "관리자 수동 크레딧 추가",
      tx,
    });

    return tx.walletTopupPayment.update({
      where: { id: payment.id },
      data: {
        creditedAt: new Date(),
      },
    });
  });
}

export async function refundWalletTopupByAdmin(params: {
  walletTopupPaymentId: string;
}) {
  const topup = await prisma.walletTopupPayment.findUnique({
    where: { id: params.walletTopupPaymentId },
  });

  if (!topup) {
    throw new AppError("환불할 충전 기록을 찾지 못했습니다.", 404);
  }

  if (!topup.creditedAt) {
    throw new AppError("아직 충전이 완료되지 않아 환불할 수 없습니다.", 400);
  }

  if (topup.refundedAt) {
    throw new AppError("이미 환불된 충전입니다.", 400);
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<{ locked: number }[]>`
      SELECT 1::int AS locked
      FROM pg_advisory_xact_lock(hashtext(${`wallet-refund:${topup.id}`}))
    `;

    await refundWalletCredits({
      userId: topup.userId,
      amount: topup.amount,
      walletTopupPaymentId: topup.id,
      referenceKey: `wallet-refund:${topup.id}`,
      memo: "관리자 수동 환불",
      tx,
    });

    return tx.walletTopupPayment.update({
      where: { id: topup.id },
      data: {
        status: WalletTopupStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });
  });
}

export async function listWalletTopupHistoryForUser(userId: string) {
  return prisma.walletTopupPayment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function listWalletTopupAdminItems(): Promise<WalletTopupAdminItem[]> {
  return prisma.user.findMany({
    where: {
      role: UserRole.TRADESMAN,
    },
    select: {
      id: true,
      fullName: true,
      wallet: {
        select: {
          balance: true,
        },
      },
      walletTopupPayments: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });
}
