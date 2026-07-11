import {
  AccountStatus,
  CreditTransactionType,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type ExpertWalletStatus = "active" | "watch" | "suspended";

export type AdminWalletTransactionRow = {
  id: string;
  expertId: string;
  type: "credit" | "deduct";
  amount: number;
  memo: string;
  createdAt: string;
};

export type AdminWalletRow = {
  id: string;
  name: string;
  currentBalance: number;
  status: ExpertWalletStatus;
  history: AdminWalletTransactionRow[];
};

export type AdminQuoteFeeRevenueRow = {
  id: string;
  expertName: string;
  quoteRequestTitle: string;
  quoteRequestId: string | null;
  amount: number;
  createdAt: string;
};

function toWalletStatus(status: AccountStatus): ExpertWalletStatus {
  if (status === AccountStatus.SUSPENDED) return "suspended";
  if (status === AccountStatus.PENDING_APPROVAL) return "watch";
  return "active";
}

function toTransactionRow(transaction: {
  id: string;
  userId: string;
  amount: number;
  type: CreditTransactionType;
  memo: string | null;
  createdAt: Date;
}): AdminWalletTransactionRow {
  const isTopup = transaction.type === CreditTransactionType.TOPUP;

  return {
    id: transaction.id,
    expertId: transaction.userId,
    type: isTopup ? "credit" : "deduct",
    amount: isTopup ? transaction.amount : -transaction.amount,
    memo:
      transaction.memo ??
      (isTopup ? "Credit top-up" : "Quote fee charge"),
    createdAt: transaction.createdAt.toISOString(),
  };
}

export async function listAdminQuoteFeeRevenue(params?: {
  take?: number;
}): Promise<AdminQuoteFeeRevenueRow[]> {
  const transactions = await prisma.creditTransaction.findMany({
    where: {
      type: CreditTransactionType.CHARGE,
      OR: [
        { referenceKey: { startsWith: "quote-fee:" } },
        { referenceKey: { startsWith: "quote-charge:" } },
      ],
    },
    include: {
      user: {
        select: {
          fullName: true,
        },
      },
      quoteRequest: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: params?.take ?? 20,
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    expertName: transaction.user.fullName,
    quoteRequestTitle: transaction.quoteRequest?.title ?? "Deleted request",
    quoteRequestId: transaction.quoteRequest?.id ?? transaction.quoteRequestId,
    amount: transaction.amount,
    createdAt: transaction.createdAt.toISOString(),
  }));
}

export async function getAdminQuoteFeeRevenueStats() {
  const [totalRevenue, revenueRows, walletCount] = await Promise.all([
    prisma.creditTransaction.aggregate({
      where: {
        type: CreditTransactionType.CHARGE,
        OR: [
          { referenceKey: { startsWith: "quote-fee:" } },
          { referenceKey: { startsWith: "quote-charge:" } },
        ],
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
    listAdminQuoteFeeRevenue({ take: 5 }),
    prisma.wallet.count(),
  ]);

  return {
    totalRevenue: totalRevenue._sum.amount ?? 0,
    feeCount: totalRevenue._count,
    recentRows: revenueRows,
    walletCount,
  };
}

export async function listAdminWallets(): Promise<AdminWalletRow[]> {
  const users = await prisma.user.findMany({
    where: {
      role: UserRole.TRADESMAN,
    },
    select: {
      id: true,
      fullName: true,
      status: true,
      wallet: true,
      creditTransactions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.fullName,
    currentBalance: user.wallet?.balance ?? 0,
    status: toWalletStatus(user.status),
    history: user.creditTransactions.map(toTransactionRow),
  }));
}
