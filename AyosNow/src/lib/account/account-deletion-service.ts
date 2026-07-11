import {
  AccountStatus,
  UserRole,
} from "@prisma/client";
import type { AccountDeletionRequestStatus } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";

export interface AccountDeletionState {
  pendingRequest: {
    id: string;
    reason: string | null;
    requestedAt: Date;
  } | null;
}

export interface AccountDeletionAdminItem {
  id: string;
  status: AccountDeletionRequestStatus;
  reason: string | null;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: AccountStatus;
  };
  reviewerAdmin: {
    fullName: string;
    email: string;
  } | null;
}

export async function getAccountDeletionState(userId: string): Promise<AccountDeletionState> {
  const pendingRequest = await prisma.accountDeletionRequest.findFirst({
    where: {
      userId,
      status: "PENDING",
    },
    orderBy: {
      requestedAt: "desc",
    },
    select: {
      id: true,
      reason: true,
      requestedAt: true,
    },
  });

  return { pendingRequest };
}

export async function requestAccountDeletion(params: {
  userId: string;
  reason?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!user || user.status !== AccountStatus.ACTIVE) {
    throw new AppError("Only active accounts can request account deletion.", 403);
  }

  const existingPending = await prisma.accountDeletionRequest.findFirst({
    where: {
      userId: params.userId,
      status: "PENDING",
    },
    orderBy: {
      requestedAt: "desc",
    },
    select: {
      id: true,
      requestedAt: true,
      reason: true,
    },
  });

  if (existingPending) {
    return existingPending;
  }

  return prisma.accountDeletionRequest.create({
    data: {
      userId: params.userId,
      reason: params.reason?.trim() || null,
      ipAddress: params.ipAddress?.trim() || null,
      userAgent: params.userAgent?.trim().slice(0, 500) || null,
    },
    select: {
      id: true,
      requestedAt: true,
      reason: true,
    },
  });
}

export async function listAccountDeletionAdminItems(): Promise<AccountDeletionAdminItem[]> {
  return prisma.accountDeletionRequest.findMany({
    orderBy: [
      { status: "asc" },
      { requestedAt: "desc" },
    ],
    take: 25,
    select: {
      id: true,
      status: true,
      reason: true,
      requestedAt: true,
      reviewedAt: true,
      reviewNote: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
        },
      },
      reviewerAdmin: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function reviewAccountDeletionRequest(params: {
  requestId: string;
  adminUserId: string;
  status: "COMPLETED" | "CANCELLED";
  reviewNote?: string;
}) {
  const request = await prisma.accountDeletionRequest.findUnique({
    where: { id: params.requestId },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!request) {
    throw new AppError("Account deletion request was not found.", 404);
  }

  if (request.status !== "PENDING") {
    throw new AppError("This account deletion request has already been reviewed.", 409);
  }

  return prisma.$transaction(async (tx) => {
    const reviewedRequest = await tx.accountDeletionRequest.update({
      where: { id: params.requestId },
      data: {
        status: params.status,
        reviewerAdminId: params.adminUserId,
        reviewedAt: new Date(),
        reviewNote: params.reviewNote?.trim() || null,
      },
      select: {
        id: true,
        status: true,
        reviewedAt: true,
      },
    });

    if (params.status === "COMPLETED") {
      await tx.user.update({
        where: { id: request.userId },
        data: {
          status: AccountStatus.SUSPENDED,
          avatarUrl: null,
          lastSeenAt: null,
        },
      });
    }

    return reviewedRequest;
  });
}
