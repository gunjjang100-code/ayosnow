import {
  UserRole,
  WalletTopupProvider,
  WalletTopupStatus,
} from "@prisma/client";
import crypto from "node:crypto";

import { AppError } from "@/lib/errors/app-error";
import {
  getPaymentPolicyConsentStatus,
  recordPaymentPolicyConsent,
} from "@/lib/legal-consent";
import { legalPolicySettings } from "@/lib/legal-shared";
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
  acceptedPaymentPolicy: boolean;
  paymentPolicyIpAddress?: string | null;
  paymentPolicyUserAgent?: string | null;
}) {
  if (!isSupportedWalletTopupAmount(params.amount)) {
    throw new AppError(
      `Top-up amount must be one of ${WALLET_TOPUP_PACKAGES.join(" / ")} PHP.`,
      400,
    );
  }

  await ensureWalletForUser({
    userId: params.userId,
  });

  const paymentPolicyConsent = await getPaymentPolicyConsentStatus({
    userId: params.userId,
  });

  let paymentPolicyAcceptedAt = paymentPolicyConsent.acceptedAt ?? new Date();

  if (paymentPolicyConsent.requiresAcceptance) {
    if (!params.acceptedPaymentPolicy) {
      throw new AppError(
        "You must accept the latest Payment & Refund Policy before payment.",
        428,
      );
    }

    const recordedConsent = await recordPaymentPolicyConsent({
      userId: params.userId,
      paymentPolicyVersion: legalPolicySettings.paymentPolicyVersion,
      ipAddress: params.paymentPolicyIpAddress,
      userAgent: params.paymentPolicyUserAgent,
    });
    paymentPolicyAcceptedAt = recordedConsent.acceptedAt;
  }

  const existingPendingPayment = await prisma.walletTopupPayment.findFirst({
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
    return prisma.walletTopupPayment.update({
      where: { id: existingPendingPayment.id },
      data: {
        acceptedPaymentPolicy: true,
        paymentPolicyVersion: legalPolicySettings.paymentPolicyVersion,
        paymentPolicyAcceptedAt,
        paymentPolicyIpAddress: params.paymentPolicyIpAddress,
        paymentPolicyUserAgent: params.paymentPolicyUserAgent,
      },
    });
  }

  if (existingPendingPayment) {
    throw new AppError(
      "A matching top-up session is being prepared. Please try again shortly.",
      409,
    );
  }

  const topupPayment = await prisma.walletTopupPayment.create({
    data: {
      userId: params.userId,
      amount: params.amount,
      provider: WalletTopupProvider.PAYMONGO,
      status: WalletTopupStatus.PENDING,
      idempotencyKey: crypto.randomUUID(),
      acceptedPaymentPolicy: true,
      paymentPolicyVersion: legalPolicySettings.paymentPolicyVersion,
      paymentPolicyAcceptedAt,
      paymentPolicyIpAddress: params.paymentPolicyIpAddress,
      paymentPolicyUserAgent: params.paymentPolicyUserAgent,
    },
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
                  name: `PuntaGo credits ${params.amount} PHP`,
                  quantity: 1,
                  description: "Credits for professional quote submissions",
                },
              ],
              description: "PuntaGo professional credit top-up",
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
          error instanceof Error ? error.message : "Could not create the checkout session.",
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
    throw new AppError("Could not find that checkout top-up record.", 404);
  }

  if (payment.refundedAt) {
    return payment;
  }

  const latest = await prisma.walletTopupPayment.findUnique({
    where: { id: payment.id },
  });

  if (!latest) {
    throw new AppError("Could not find the top-up record.", 404);
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
  });

  return prisma.walletTopupPayment.update({
    where: { id: latest.id },
    data: {
      status: WalletTopupStatus.PAID,
      paidAt: latest.paidAt ?? new Date(),
      creditedAt: latest.creditedAt ?? new Date(),
      paidEventId: latest.paidEventId ?? params.eventId,
      providerPaymentId: latest.providerPaymentId ?? params.providerPaymentId ?? null,
    },
  });
}

export async function createManualAdminTopup(params: {
  userId: string;
  amount: number;
}) {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AppError("Top-up amount must be at least 1.", 400);
  }

  const payment = await prisma.walletTopupPayment.create({
    data: {
      userId: params.userId,
      amount: params.amount,
      provider: WalletTopupProvider.MANUAL_ADMIN,
      status: WalletTopupStatus.PAID,
      idempotencyKey: crypto.randomUUID(),
      paidAt: new Date(),
    },
  });

  try {
    await creditWalletFromTopup({
      userId: params.userId,
      amount: params.amount,
      walletTopupPaymentId: payment.id,
      referenceKey: `wallet-topup:${payment.id}`,
      memo: "Admin manual credit add",
    });

    return prisma.walletTopupPayment.update({
      where: { id: payment.id },
      data: {
        creditedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.walletTopupPayment.update({
      where: { id: payment.id },
      data: {
        status: WalletTopupStatus.FAILED,
        failureMessage:
          error instanceof Error ? error.message : "Admin manual top-up failed.",
      },
    });

    throw error;
  }
}

export async function refundWalletTopupByAdmin(params: {
  walletTopupPaymentId: string;
}) {
  const topup = await prisma.walletTopupPayment.findUnique({
    where: { id: params.walletTopupPaymentId },
  });

  if (!topup) {
    throw new AppError("Could not find the top-up record to refund.", 404);
  }

  if (!topup.creditedAt) {
    throw new AppError("This top-up is not completed yet, so it cannot be refunded.", 400);
  }

  if (topup.refundedAt) {
    throw new AppError("This top-up was already refunded.", 400);
  }

  await refundWalletCredits({
    userId: topup.userId,
    amount: topup.amount,
    walletTopupPaymentId: topup.id,
    referenceKey: `wallet-refund:${topup.id}`,
    memo: "Admin manual refund",
  });

  return prisma.walletTopupPayment.update({
    where: { id: topup.id },
    data: {
      status: WalletTopupStatus.REFUNDED,
      refundedAt: new Date(),
    },
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
