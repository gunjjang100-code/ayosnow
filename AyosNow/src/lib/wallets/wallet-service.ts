import { CreditTransactionType, Prisma, UserRole } from "@prisma/client";
import crypto from "node:crypto";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";
import {
  buildQuoteSubmissionFeeReferenceKey,
  QUOTE_SUBMISSION_CREDIT_COST,
} from "@/lib/wallets/wallet-topup-config";

type PrismaTransactionClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function getDb(tx?: PrismaTransactionClient) {
  return tx ?? prisma;
}

function toPhpInt(value: number) {
  return value;
}

async function getLockedWalletForUser(params: {
  userId: string;
  tx?: PrismaTransactionClient;
  initialBalance?: number;
}) {
  const db = getDb(params.tx);

  await ensureWalletForUser({
    userId: params.userId,
    initialBalance: params.initialBalance,
    tx: params.tx,
  });

  const wallet = await db.wallet.findUnique({
    where: { userId: params.userId },
  });

  if (!wallet) {
    throw new AppError("Could not find wallet information.", 404);
  }

  return wallet;
}

export { QUOTE_SUBMISSION_CREDIT_COST };

export async function ensureWalletForUser(params: {
  userId: string;
  initialBalance?: number;
  initialWithdrawableBalance?: number;
  initialHoldBalance?: number;
  initialTotalEarnings?: number;
  tx?: PrismaTransactionClient;
}) {
  const db = getDb(params.tx);

  return db.wallet.upsert({
    where: { userId: params.userId },
    update: {},
    create: {
      userId: params.userId,
      balance: params.initialBalance ?? 0,
      withdrawableBalance: params.initialWithdrawableBalance ?? 0,
      holdBalance: params.initialHoldBalance ?? 0,
      totalEarnings: params.initialTotalEarnings ?? 0,
    },
  });
}

export async function getWalletBalanceForUser(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  return wallet ? toPhpInt(wallet.balance) : 0;
}

export async function getWalletSnapshotForUser(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  return {
    balance: wallet ? toPhpInt(wallet.balance) : 0,
  };
}

export async function listWalletCreditTransactionsForUser(userId: string) {
  const transactions = await prisma.creditTransaction.findMany({
    where: {
      userId,
    },
    include: {
      quoteRequest: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    amount:
      transaction.type === CreditTransactionType.TOPUP
        ? transaction.amount
        : -transaction.amount,
    label:
      transaction.memo ??
      (transaction.type === CreditTransactionType.TOPUP
        ? "Credit top-up"
        : "Quote fee deduction"),
    quoteRequestTitle: transaction.quoteRequest?.title ?? null,
    type: transaction.type,
    createdAt: transaction.createdAt.toISOString(),
  }));
}

export async function chargeCreditsForQuoteSubmission(params: {
  userId: string;
  quoteRequestId: string;
  quoteId: string;
  tx?: PrismaTransactionClient;
  amount?: number;
}) {
  const db = getDb(params.tx);
  const chargeAmount = params.amount ?? QUOTE_SUBMISSION_CREDIT_COST;
  // 중복 차감 방지 핵심:
  // quoteId가 아니라 "전문가 + 견적요청" 기준으로 고정 키를 만든다.
  // 같은 전문가가 같은 요청에 견적을 수정해도 이 키가 이미 있으면 추가 차감하지 않는다.
  const referenceKey = buildQuoteSubmissionFeeReferenceKey({
    userId: params.userId,
    quoteRequestId: params.quoteRequestId,
  });

  const existingCharge = await db.creditTransaction.findUnique({
    where: { referenceKey },
  });

  if (existingCharge) {
    return getLockedWalletForUser({
      userId: params.userId,
      tx: params.tx,
    });
  }

  const wallet = await getLockedWalletForUser({
    userId: params.userId,
    tx: params.tx,
  });

  if (toPhpInt(wallet.balance) < chargeAmount) {
    throw new AppError("Not enough credits. Please top up.", 400);
  }

  const transaction = await db.creditTransaction.create({
    data: {
      userId: params.userId,
      quoteRequestId: params.quoteRequestId,
      amount: chargeAmount,
      type: CreditTransactionType.CHARGE,
      memo: `Quote submission fee ${chargeAmount} PHP · Quote ${params.quoteId.slice(-6)}`,
      referenceKey,
    },
  });

  const updateResult = await db.wallet.updateMany({
    where: {
      userId: params.userId,
      balance: {
        gte: chargeAmount,
      },
    },
    data: {
      balance: {
        decrement: chargeAmount,
      },
    },
  });

  if (updateResult.count !== 1) {
    await db.creditTransaction.delete({
      where: { id: transaction.id },
    });

    throw new AppError("Credit deduction status changed. Please try again.", 409);
  }

  return getLockedWalletForUser({
    userId: params.userId,
    tx: params.tx,
  });
}

export async function creditWalletFromTopup(params: {
  userId: string;
  amount: number;
  walletTopupPaymentId: string;
  referenceKey: string;
  memo?: string;
  tx?: PrismaTransactionClient;
}) {
  const db = getDb(params.tx);

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AppError("Top-up amount must be at least 1.", 400);
  }

  const existingTopup = await db.creditTransaction.findUnique({
    where: { referenceKey: params.referenceKey },
  });

  if (existingTopup) {
    return getLockedWalletForUser({
      userId: params.userId,
      tx: params.tx,
    });
  }

  await ensureWalletForUser({
    userId: params.userId,
    tx: params.tx,
  });

  const transaction = await db.creditTransaction.create({
    data: {
      userId: params.userId,
      walletTopupPaymentId: params.walletTopupPaymentId,
      amount: params.amount,
      type: CreditTransactionType.TOPUP,
      memo: params.memo,
      referenceKey: params.referenceKey,
    },
  });

  try {
    await db.wallet.update({
      where: { userId: params.userId },
      data: {
        balance: {
          increment: params.amount,
        },
      },
    });
  } catch (error) {
    await db.creditTransaction.delete({
      where: { id: transaction.id },
    });

    throw error;
  }

  return getLockedWalletForUser({
    userId: params.userId,
    tx: params.tx,
  });
}

export async function refundWalletCredits(params: {
  userId: string;
  amount: number;
  walletTopupPaymentId: string;
  referenceKey: string;
  memo?: string;
  tx?: PrismaTransactionClient;
}) {
  const db = getDb(params.tx);

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AppError("Refund amount must be at least 1.", 400);
  }

  const existingRefund = await db.creditTransaction.findUnique({
    where: { referenceKey: params.referenceKey },
  });

  if (existingRefund) {
    return getLockedWalletForUser({
      userId: params.userId,
      tx: params.tx,
    });
  }

  const wallet = await getLockedWalletForUser({
    userId: params.userId,
    tx: params.tx,
  });

  if (toPhpInt(wallet.balance) < params.amount) {
    throw new AppError("Refund amount cannot exceed the current balance.", 400);
  }

  const transaction = await db.creditTransaction.create({
    data: {
      userId: params.userId,
      walletTopupPaymentId: params.walletTopupPaymentId,
      amount: params.amount,
      type: CreditTransactionType.REFUND,
      memo: params.memo,
      referenceKey: params.referenceKey,
    },
  });

  const updateResult = await db.wallet.updateMany({
    where: {
      userId: params.userId,
      balance: {
        gte: params.amount,
      },
    },
    data: {
      balance: {
        decrement: params.amount,
      },
    },
  });

  if (updateResult.count !== 1) {
    await db.creditTransaction.delete({
      where: { id: transaction.id },
    });

    throw new AppError("Refund status changed. Please try again.", 409);
  }

  return getLockedWalletForUser({
    userId: params.userId,
    tx: params.tx,
  });
}

export async function topupWalletBalance(params: {
  userId: string;
  amount: number;
  walletTopupPaymentId: string;
  referenceKey: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      role: true,
      fullName: true,
    },
  });

  if (!user) {
    throw new AppError("Could not find the professional to top up.", 404);
  }

  if (user.role !== UserRole.TRADESMAN) {
    throw new AppError("Only professional accounts can receive top-ups.", 400);
  }

  const wallet = await creditWalletFromTopup({
    userId: params.userId,
    amount: params.amount,
    walletTopupPaymentId: params.walletTopupPaymentId,
    referenceKey: params.referenceKey,
  });

  return {
    wallet,
    user,
  };
}

export async function deductWalletCreditsByAdmin(params: {
  userId: string;
  amount: number;
  memo?: string;
}) {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AppError("Deduction amount must be at least 1.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      role: true,
      fullName: true,
    },
  });

  if (!user) {
    throw new AppError("Could not find the professional to deduct from.", 404);
  }

  if (user.role !== UserRole.TRADESMAN) {
    throw new AppError("Only professional accounts can be deducted.", 400);
  }

  const lockedWallet = await getLockedWalletForUser({
    userId: params.userId,
  });

  if (toPhpInt(lockedWallet.balance) < params.amount) {
    throw new AppError("Insufficient balance for deduction.", 400);
  }

  const transaction = await prisma.creditTransaction.create({
    data: {
      userId: params.userId,
      amount: params.amount,
      type: CreditTransactionType.CHARGE,
      memo: params.memo ?? "Admin manual credit deduction",
      referenceKey: `admin-deduct:${crypto.randomUUID()}`,
    },
  });

  const updateResult = await prisma.wallet.updateMany({
    where: {
      userId: params.userId,
      balance: {
        gte: params.amount,
      },
    },
    data: {
      balance: {
        decrement: params.amount,
      },
    },
  });

  if (updateResult.count !== 1) {
    await prisma.creditTransaction.delete({
      where: { id: transaction.id },
    });

    throw new AppError("Balance changed during deduction. Please try again.", 409);
  }

  const wallet = await getLockedWalletForUser({
    userId: params.userId,
  });

  return {
    wallet,
    user,
  };
}
