import test from "node:test";
import assert from "node:assert/strict";

import { UserRole } from "@prisma/client";

import { isAllowedMutationOrigin } from "../src/lib/auth/csrf.ts";
import { requiresPaymentPolicyAcceptance } from "../src/lib/legal-shared.ts";
import { canGrantProfessionalReferralReward } from "../src/lib/referrals/referral-policy.ts";
import { signUpSchema } from "../src/lib/validations/auth.ts";
import { bookingReviewSchema } from "../src/lib/validations/review.ts";
import { walletSelfTopupSchema } from "../src/lib/validations/wallet-topup.ts";
import { buildQuoteSubmissionFeeReferenceKey } from "../src/lib/wallets/wallet-topup-config.ts";

test("운영 환경 mutation API는 같은 Origin 요청만 허용한다", () => {
  assert.equal(
    isAllowedMutationOrigin({
      method: "POST",
      origin: "https://puntago.net",
      host: "puntago.net",
      nodeEnv: "production",
    }),
    true,
  );

  assert.equal(
    isAllowedMutationOrigin({
      method: "POST",
      origin: "https://evil.example",
      host: "puntago.net",
      nodeEnv: "production",
    }),
    false,
  );

  assert.equal(
    isAllowedMutationOrigin({
      method: "POST",
      origin: null,
      host: "puntago.net",
      secFetchSite: "cross-site",
      nodeEnv: "production",
    }),
    false,
  );

  assert.equal(
    isAllowedMutationOrigin({
      method: "POST",
      origin: null,
      host: "puntago.net",
      secFetchSite: "same-origin",
      nodeEnv: "production",
    }),
    true,
  );

  assert.equal(
    isAllowedMutationOrigin({
      method: "POST",
      origin: null,
      host: "puntago.net",
      secFetchSite: null,
      nodeEnv: "production",
    }),
    false,
  );
});

test("읽기 요청은 Origin이 없어도 CSRF 검사 대상이 아니다", () => {
  assert.equal(
    isAllowedMutationOrigin({
      method: "GET",
      origin: null,
      host: "puntago.net",
      nodeEnv: "production",
    }),
    true,
  );
});

test("견적 수수료 중복 방지 키는 전문가와 요청서 기준으로 고정된다", () => {
  const first = buildQuoteSubmissionFeeReferenceKey({
    userId: "expert_1",
    quoteRequestId: "request_1",
  });
  const second = buildQuoteSubmissionFeeReferenceKey({
    userId: "expert_1",
    quoteRequestId: "request_1",
  });
  const otherRequest = buildQuoteSubmissionFeeReferenceKey({
    userId: "expert_1",
    quoteRequestId: "request_2",
  });

  assert.equal(first, second);
  assert.notEqual(first, otherRequest);
});

test("후기 작성은 1~5점과 충분한 후기 내용만 허용한다", () => {
  assert.equal(
    bookingReviewSchema.safeParse({
      rating: 5,
      comment: "작업이 빠르고 설명도 친절했습니다.",
      photoUrl: "",
    }).success,
    true,
  );

  assert.equal(
    bookingReviewSchema.safeParse({
      rating: 6,
      comment: "작업이 빠르고 설명도 친절했습니다.",
      photoUrl: "",
    }).success,
    false,
  );

  assert.equal(
    bookingReviewSchema.safeParse({
      rating: 5,
      comment: "짧음",
      photoUrl: "",
    }).success,
    false,
  );
});

test("회원가입은 필수 법적 동의 없이는 실패한다", () => {
  const baseSignup = {
    fullName: "Maria Cruz",
    email: "maria@example.com",
    password: "password123",
    phoneNumber: "+639171234567",
    role: "customer",
    referralCode: "",
  };

  assert.equal(
    signUpSchema.safeParse({
      ...baseSignup,
      consent: {
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedPaymentPolicy: false,
        acceptedPlatformRole: true,
        acceptedProfessionalPolicy: false,
        acceptedMarketing: false,
      },
    }).success,
    true,
  );

  assert.equal(
    signUpSchema.safeParse({
      ...baseSignup,
      consent: {
        acceptedTerms: true,
        acceptedPrivacy: false,
        acceptedPaymentPolicy: false,
        acceptedPlatformRole: true,
        acceptedProfessionalPolicy: false,
        acceptedMarketing: false,
      },
    }).success,
    false,
  );
});

test("전문가 가입은 Professional Policy 동의가 필요하다", () => {
  assert.equal(
    signUpSchema.safeParse({
      fullName: "Juan Pro",
      email: "juan@example.com",
      password: "password123",
      phoneNumber: "+639171234567",
      role: "tradesman",
      referralCode: "",
      categorySlugs: ["plumbing"],
      consent: {
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedPaymentPolicy: false,
        acceptedPlatformRole: true,
        acceptedProfessionalPolicy: false,
        acceptedMarketing: false,
      },
    }).success,
    false,
  );
});

test("전문가 가입은 최소 1개 서비스 카테고리가 필요하다", () => {
  const baseProfessionalSignup = {
    fullName: "Juan Pro",
    email: "juan-category@example.com",
    password: "password123",
    phoneNumber: "+639171234567",
    role: "tradesman",
    referralCode: "",
    consent: {
      acceptedTerms: true,
      acceptedPrivacy: true,
      acceptedPaymentPolicy: false,
      acceptedPlatformRole: true,
      acceptedProfessionalPolicy: true,
      acceptedMarketing: false,
    },
  };

  assert.equal(
    signUpSchema.safeParse({
      ...baseProfessionalSignup,
      categorySlugs: [],
    }).success,
    false,
  );

  assert.equal(
    signUpSchema.safeParse({
      ...baseProfessionalSignup,
      categorySlugs: ["plumbing"],
    }).success,
    true,
  );
});

test("지갑 충전 요청은 동의 값을 선택적으로 받을 수 있다", () => {
  assert.equal(
    walletSelfTopupSchema.safeParse({
      amount: 200,
      acceptedPaymentPolicy: true,
    }).success,
    true,
  );

  assert.equal(
    walletSelfTopupSchema.safeParse({
      amount: 200,
      acceptedPaymentPolicy: false,
    }).success,
    true,
  );
});

test("Payment & Refund Policy 첫 결제는 동의가 필요하다", () => {
  assert.equal(requiresPaymentPolicyAcceptance(null, "2026-06-30"), true);
});

test("Payment & Refund Policy 같은 버전 재결제는 동의를 다시 묻지 않는다", () => {
  assert.equal(
    requiresPaymentPolicyAcceptance("2026-06-30", "2026-06-30"),
    false,
  );
});

test("Payment & Refund Policy 버전이 바뀌면 재동의가 필요하다", () => {
  assert.equal(
    requiresPaymentPolicyAcceptance("2026-06-30", "2026-07-15"),
    true,
  );
});

test("추천 보상은 전문가가 전문가를 초대한 경우에만 지급된다", () => {
  assert.equal(
    canGrantProfessionalReferralReward({
      referrerRole: UserRole.TRADESMAN,
      referredRole: UserRole.TRADESMAN,
    }),
    true,
  );

  assert.equal(
    canGrantProfessionalReferralReward({
      referrerRole: UserRole.TRADESMAN,
      referredRole: UserRole.CUSTOMER,
    }),
    false,
  );

  assert.equal(
    canGrantProfessionalReferralReward({
      referrerRole: UserRole.CUSTOMER,
      referredRole: UserRole.TRADESMAN,
    }),
    false,
  );
});
