import type { NextRequest } from "next/server";

import {
  currentPolicyVersion,
  legalPolicySettings,
  requiresPaymentPolicyAcceptance,
} from "@/lib/legal-shared";
import { prisma } from "@/lib/prisma";

export interface ConsentInput {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedPaymentPolicy: boolean;
  acceptedPlatformRole: boolean;
  acceptedProfessionalPolicy: boolean;
  acceptedMarketing: boolean;
}

export function getRequestIpAddress(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return request.headers.get("cf-connecting-ip") ?? forwardedFor ?? null;
}

export function getRequestUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") ?? null;
}

export async function recordUserConsent(params: {
  userId: string;
  consent: ConsentInput;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const paymentPolicyAcceptedAt = params.consent.acceptedPaymentPolicy ? new Date() : undefined;
  const paymentPolicyData = params.consent.acceptedPaymentPolicy
    ? {
        acceptedPaymentPolicy: true,
        acceptedPaymentPolicyVersion: legalPolicySettings.paymentPolicyVersion,
        acceptedPaymentPolicyAt: paymentPolicyAcceptedAt,
      }
    : {};

  return prisma.userConsent.upsert({
    where: {
      userId_policyVersion: {
        userId: params.userId,
        policyVersion: currentPolicyVersion,
      },
    },
    update: {
      acceptedTerms: params.consent.acceptedTerms,
      acceptedPrivacy: params.consent.acceptedPrivacy,
      ...paymentPolicyData,
      acceptedProfessionalPolicy: params.consent.acceptedProfessionalPolicy,
      acceptedMarketing: params.consent.acceptedMarketing,
      acceptedAt: new Date(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
    create: {
      userId: params.userId,
      policyVersion: currentPolicyVersion,
      acceptedTerms: params.consent.acceptedTerms,
      acceptedPrivacy: params.consent.acceptedPrivacy,
      acceptedPaymentPolicy: params.consent.acceptedPaymentPolicy,
      acceptedPaymentPolicyVersion: params.consent.acceptedPaymentPolicy
        ? legalPolicySettings.paymentPolicyVersion
        : null,
      acceptedPaymentPolicyAt: paymentPolicyAcceptedAt ?? null,
      acceptedProfessionalPolicy: params.consent.acceptedProfessionalPolicy,
      acceptedMarketing: params.consent.acceptedMarketing,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

export async function getPaymentPolicyConsentStatus(params: {
  userId: string;
  paymentPolicyVersion?: string;
}) {
  const paymentPolicyVersion =
    params.paymentPolicyVersion ?? legalPolicySettings.paymentPolicyVersion;
  const consent = await prisma.userConsent.findFirst({
    where: {
      userId: params.userId,
      acceptedPaymentPolicy: true,
      OR: [
        {
          acceptedPaymentPolicyVersion: paymentPolicyVersion,
        },
        {
          acceptedPaymentPolicyVersion: null,
          policyVersion: paymentPolicyVersion,
        },
      ],
    },
    orderBy: [
      {
        acceptedPaymentPolicyAt: "desc",
      },
      {
        acceptedAt: "desc",
      },
    ],
    select: {
      acceptedPaymentPolicyVersion: true,
      acceptedPaymentPolicyAt: true,
      acceptedAt: true,
      policyVersion: true,
    },
  });
  const acceptedPaymentPolicyVersion =
    consent?.acceptedPaymentPolicyVersion ?? consent?.policyVersion ?? null;

  return {
    paymentPolicyVersion,
    acceptedPaymentPolicyVersion,
    acceptedAt: consent?.acceptedPaymentPolicyAt ?? consent?.acceptedAt ?? null,
    requiresAcceptance: requiresPaymentPolicyAcceptance(
      acceptedPaymentPolicyVersion,
      paymentPolicyVersion,
    ),
  };
}

export async function recordPaymentPolicyConsent(params: {
  userId: string;
  paymentPolicyVersion?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const paymentPolicyVersion =
    params.paymentPolicyVersion ?? legalPolicySettings.paymentPolicyVersion;
  const acceptedAt = new Date();

  await prisma.userConsent.upsert({
    where: {
      userId_policyVersion: {
        userId: params.userId,
        policyVersion: currentPolicyVersion,
      },
    },
    update: {
      acceptedPaymentPolicy: true,
      acceptedPaymentPolicyVersion: paymentPolicyVersion,
      acceptedPaymentPolicyAt: acceptedAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
    create: {
      userId: params.userId,
      policyVersion: currentPolicyVersion,
      acceptedTerms: false,
      acceptedPrivacy: false,
      acceptedPaymentPolicy: true,
      acceptedPaymentPolicyVersion: paymentPolicyVersion,
      acceptedPaymentPolicyAt: acceptedAt,
      acceptedProfessionalPolicy: false,
      acceptedMarketing: false,
      acceptedAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });

  return {
    paymentPolicyVersion,
    acceptedAt,
  };
}
