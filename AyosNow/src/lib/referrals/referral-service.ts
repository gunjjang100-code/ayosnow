import { randomBytes } from "crypto";

import { Prisma, ReferralRewardStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { canGrantProfessionalReferralReward } from "@/lib/referrals/referral-policy";

const DEFAULT_REFERRAL_REWARD_CREDITS = 100;

type ReferralTx = Prisma.TransactionClient;

export function normalizeReferralCode(code: string | null | undefined) {
  const normalized = code?.trim().replace(/\s+/g, "").toUpperCase();
  return normalized || null;
}

function createReferralCode() {
  return `PUNTA-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function createUniqueReferralCode(tx: ReferralTx) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createReferralCode();
    const existing = await tx.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Could not create a referral code. Please try again.");
}

export async function ensureUserReferralCode(userId: string, tx: ReferralTx = prisma) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.referralCode) {
    return user.referralCode;
  }

  const referralCode = await createUniqueReferralCode(tx);

  await tx.user.update({
    where: { id: userId },
    data: { referralCode },
  });

  return referralCode;
}

export async function findReferrerByCode(code: string | null | undefined) {
  const referralCode = normalizeReferralCode(code);

  if (!referralCode) {
    return null;
  }

  return prisma.user.findUnique({
    where: { referralCode },
    select: {
      id: true,
      fullName: true,
      role: true,
      referralCode: true,
    },
  });
}

export async function getActiveReferralSetting(tx: ReferralTx = prisma) {
  const setting = await tx.referralSetting.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return {
    rewardCredits: setting?.rewardCredits ?? DEFAULT_REFERRAL_REWARD_CREDITS,
    isActive: setting?.isActive ?? true,
  };
}

export async function grantSignupReferralReward(params: {
  tx: ReferralTx;
  referrerId: string | null;
  referrerRole?: UserRole | null;
  referredUserId: string;
  referredRole: UserRole;
}) {
  if (!params.referrerId) {
    return null;
  }

  if (
    !canGrantProfessionalReferralReward({
      referrerRole: params.referrerRole,
      referredRole: params.referredRole,
    })
  ) {
    return null;
  }

  const setting = await getActiveReferralSetting(params.tx);

  if (!setting.isActive || setting.rewardCredits <= 0) {
    return null;
  }

  return params.tx.referralReward.create({
    data: {
      referrerId: params.referrerId,
      referredUserId: params.referredUserId,
      rewardCredits: setting.rewardCredits,
      status: ReferralRewardStatus.GRANTED,
    },
  });
}

export async function getReferralSummary(userId: string) {
  const referralCode = await ensureUserReferralCode(userId);
  const [rewardSum, referralCount, setting] = await Promise.all([
    prisma.referralReward.aggregate({
      where: {
        referrerId: userId,
        status: ReferralRewardStatus.GRANTED,
      },
      _sum: { rewardCredits: true },
    }),
    prisma.user.count({
      where: {
        referredById: userId,
        role: UserRole.TRADESMAN,
      },
    }),
    getActiveReferralSetting(),
  ]);

  return {
    referralCode,
    referralCount,
    rewardCredits: rewardSum._sum.rewardCredits ?? 0,
    rewardPerSignup: setting.rewardCredits,
    isActive: setting.isActive,
  };
}
