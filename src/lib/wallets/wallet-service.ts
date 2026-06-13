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

function toPhpInt(value: number | Prisma.Decimal) {
  return typeof value === "number" ? value : Number(value);
}

async function acquireTransactionLock(params: {
  tx: PrismaTransactionClient;
  scope: string;
}) {
  // 중요한 부분:
  // 같은 지갑이나 같은 충전 기록을 동시에 만질 때,
  // PostgreSQL advisory lock으로 한 줄로 세워서 차례대로 처리한다.
  // 쉽게 말하면 "한 계산대를 한 사람씩만 쓰게" 하는 잠금 장치다.
  await params.tx.$queryRaw<{ locked: number }[]>`
    SELECT 1::int AS locked
    FROM pg_advisory_xact_lock(hashtext(${params.scope}))
  `;
}

async function getLockedWalletForUser(params: {
  userId: string;
  tx: PrismaTransactionClient;
  initialBalance?: number;
}) {
  await ensureWalletForUser({
    userId: params.userId,
    initialBalance: params.initialBalance,
    tx: params.tx,
  });

  await params.tx.$queryRaw`
    SELECT id
    FROM "Wallet"
    WHERE "userId" = ${params.userId}
    FOR UPDATE
  `;

  const wallet = await params.tx.wallet.findUnique({
    where: { userId: params.userId },
  });

  if (!wallet) {
    throw new AppError("지갑 정보를 찾지 못했습니다.", 404);
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
        ? "크레딧 충전"
        : "견적료 차감"),
    quoteRequestTitle: transaction.quoteRequest?.title ?? null,
    type: transaction.type,
    createdAt: transaction.createdAt.toISOString(),
  }));
}

export async function chargeCreditsForQuoteSubmission(params: {
  userId: string;
  quoteRequestId: string;
  quoteId: string;
  tx: PrismaTransactionClient;
  amount?: number;
}) {
  const chargeAmount = params.amount ?? QUOTE_SUBMISSION_CREDIT_COST;
  // 중복 차감 방지 핵심:
  // quoteId가 아니라 "전문가 + 견적요청" 기준으로 고정 키를 만든다.
  // 같은 전문가가 같은 요청에 견적을 수정해도 이 키가 이미 있으면 추가 차감하지 않는다.
  const referenceKey = buildQuoteSubmissionFeeReferenceKey({
    userId: params.userId,
    quoteRequestId: params.quoteRequestId,
  });

  await acquireTransactionLock({
    tx: params.tx,
    scope: `wallet:${params.userId}`,
  });

  const existingCharge = await params.tx.creditTransaction.findUnique({
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
    throw new AppError("크레딧이 부족합니다. 충전해주세요.", 400);
  }

  await params.tx.creditTransaction.create({
    data: {
      userId: params.userId,
      quoteRequestId: params.quoteRequestId,
      amount: chargeAmount,
      type: CreditTransactionType.CHARGE,
      memo: `견적 제출 수수료 ${chargeAmount} PHP · 견적 ${params.quoteId.slice(-6)}`,
      referenceKey,
    },
  });

  const updateResult = await params.tx.wallet.updateMany({
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
    throw new AppError("크레딧 차감 중 상태가 바뀌었습니다. 다시 시도해 주세요.", 409);
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
  tx: PrismaTransactionClient;
}) {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AppError("충전 금액은 1 이상이어야 합니다.", 400);
  }

  await acquireTransactionLock({
    tx: params.tx,
    scope: `wallet:${params.userId}`,
  });

  const existingTopup = await params.tx.creditTransaction.findUnique({
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

  await params.tx.creditTransaction.create({
    data: {
      userId: params.userId,
      walletTopupPaymentId: params.walletTopupPaymentId,
      amount: params.amount,
      type: CreditTransactionType.TOPUP,
      memo: params.memo,
      referenceKey: params.referenceKey,
    },
  });

  await params.tx.wallet.update({
    where: { userId: params.userId },
    data: {
      balance: {
        increment: params.amount,
      },
    },
  });

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
  tx: PrismaTransactionClient;
}) {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AppError("환불 금액은 1 이상이어야 합니다.", 400);
  }

  await acquireTransactionLock({
    tx: params.tx,
    scope: `wallet:${params.userId}`,
  });

  const existingRefund = await params.tx.creditTransaction.findUnique({
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
    throw new AppError("현재 잔액보다 큰 금액은 환불할 수 없습니다.", 400);
  }

  await params.tx.creditTransaction.create({
    data: {
      userId: params.userId,
      walletTopupPaymentId: params.walletTopupPaymentId,
      amount: params.amount,
      type: CreditTransactionType.REFUND,
      memo: params.memo,
      referenceKey: params.referenceKey,
    },
  });

  const updateResult = await params.tx.wallet.updateMany({
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
    throw new AppError("환불 처리 중 상태가 바뀌었습니다. 다시 시도해 주세요.", 409);
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
    throw new AppError("충전할 전문가를 찾지 못했습니다.", 404);
  }

  if (user.role !== UserRole.TRADESMAN) {
    throw new AppError("전문가 계정만 충전할 수 있습니다.", 400);
  }

  const wallet = await prisma.$transaction(async (tx) =>
    creditWalletFromTopup({
      userId: params.userId,
      amount: params.amount,
      walletTopupPaymentId: params.walletTopupPaymentId,
      referenceKey: params.referenceKey,
      tx,
    }),
  );

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
    throw new AppError("차감 금액은 1 이상이어야 합니다.", 400);
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
    throw new AppError("차감할 전문가를 찾지 못했습니다.", 404);
  }

  if (user.role !== UserRole.TRADESMAN) {
    throw new AppError("전문가 계정만 차감할 수 있습니다.", 400);
  }

  const wallet = await prisma.$transaction(async (tx) => {
    await acquireTransactionLock({
      tx,
      scope: `wallet:${params.userId}`,
    });

    const lockedWallet = await getLockedWalletForUser({
      userId: params.userId,
      tx,
    });

    if (toPhpInt(lockedWallet.balance) < params.amount) {
      throw new AppError("잔액이 부족해서 차감할 수 없습니다.", 400);
    }

    await tx.creditTransaction.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        type: CreditTransactionType.CHARGE,
        memo: params.memo ?? "관리자 수동 크레딧 차감",
        referenceKey: `admin-deduct:${crypto.randomUUID()}`,
      },
    });

    const updateResult = await tx.wallet.updateMany({
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
      throw new AppError("차감 처리 중 잔액이 바뀌었습니다. 다시 시도해 주세요.", 409);
    }

    return getLockedWalletForUser({
      userId: params.userId,
      tx,
    });
  });

  return {
    wallet,
    user,
  };
}
