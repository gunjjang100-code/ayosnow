import { AccountStatus, UserRole } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";

export async function getTradesmanVerificationState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      status: true,
      tradesmanProfile: {
        select: {
          id: true,
          isVerified: true,
        },
      },
    },
  });

  return {
    isTradesman: user?.role === UserRole.TRADESMAN,
    isActive: user?.status === AccountStatus.ACTIVE,
    isVerified: Boolean(user?.tradesmanProfile?.isVerified),
    profileId: user?.tradesmanProfile?.id ?? null,
  };
}

export async function assertVerifiedTradesman(userId: string) {
  const state = await getTradesmanVerificationState(userId);

  if (!state.isTradesman || !state.isActive || !state.isVerified) {
    throw new AppError(
      "Professional verification is required before using customer-facing work features.",
      403,
    );
  }

  return state;
}

export async function assertVerifiedTradesmanForCustomerWorkflow(userId: string) {
  return assertVerifiedTradesman(userId);
}
