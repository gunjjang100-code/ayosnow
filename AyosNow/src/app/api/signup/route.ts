import { AccountStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { toDbRole } from "@/lib/auth/next-auth";
import { hashPassword } from "@/lib/auth/password";
import { getRequestIpAddress, getRequestUserAgent, recordUserConsent } from "@/lib/legal-consent";
import { prisma } from "@/lib/prisma";
import {
  ensureUserReferralCode,
  findReferrerByCode,
  grantSignupReferralReward,
  normalizeReferralCode,
} from "@/lib/referrals/referral-service";
import { canGrantProfessionalReferralReward } from "@/lib/referrals/referral-policy";
import { updateTradesmanSkillSettings } from "@/lib/tradesmen/tradesman-skill-settings-service";
import { signUpSchema } from "@/lib/validations/auth";
import { ensureWalletForUser } from "@/lib/wallets/wallet-service";

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "This email is already registered. Please log in." },
      { status: 409 },
    );
  }

  const normalizedReferralCode = normalizeReferralCode(parsed.data.referralCode);
  const referrer = normalizedReferralCode
    ? await findReferrerByCode(normalizedReferralCode)
    : null;

  if (normalizedReferralCode && !referrer) {
    return NextResponse.json(
      { error: "Referral code was not found. Please check the code and try again." },
      { status: 400 },
    );
  }

  const dbRole = toDbRole(parsed.data.role);
  const canRecordProfessionalReferral = canGrantProfessionalReferralReward({
    referrerRole: referrer?.role,
    referredRole: dbRole,
  });

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      phoneNumber: parsed.data.phoneNumber,
      fullName: parsed.data.fullName,
      passwordHash: hashPassword(parsed.data.password),
      role: dbRole,
      roleSelectedAt: new Date(),
      status: AccountStatus.ACTIVE,
      referredById: canRecordProfessionalReferral ? referrer?.id : null,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  try {
    if (parsed.data.role === "tradesman") {
      await ensureWalletForUser({
        userId: user.id,
      });
      await updateTradesmanSkillSettings({
        userId: user.id,
        categorySlugs: parsed.data.categorySlugs,
      });
    }

    await recordUserConsent({
      userId: user.id,
      consent: parsed.data.consent,
      ipAddress: getRequestIpAddress(request),
      userAgent: getRequestUserAgent(request),
    });

    await ensureUserReferralCode(user.id);
    await grantSignupReferralReward({
      tx: prisma,
      referrerId: referrer?.id ?? null,
      referrerRole: referrer?.role ?? null,
      referredUserId: user.id,
      referredRole: user.role,
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => null);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not finish account setup after signup. Please try again.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: parsed.data.role,
    },
  });
}
