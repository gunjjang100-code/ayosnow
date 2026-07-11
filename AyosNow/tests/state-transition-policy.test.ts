import test from "node:test";
import assert from "node:assert/strict";

import { BookingStatus, QuoteRequestStatus } from "@prisma/client";

import { canCancelBooking } from "../src/lib/bookings/booking-cancel-policy.ts";
import { canCustomerChangeQuoteRequest } from "../src/lib/quote-requests/quote-request-policy.ts";
import { tradesmanQuoteSchema } from "../src/lib/validations/quote.ts";
import { quoteRequestSchema } from "../src/lib/validations/quote-request.ts";
import { adminExpertApprovalCreateSchema } from "../src/lib/validations/admin-expert-approval.ts";
import {
  accountDeletionRequestSchema,
  adminAccountDeletionReviewSchema,
} from "../src/lib/validations/account-deletion.ts";

test("견적 요청은 OPEN 상태에서만 고객이 수정 또는 취소할 수 있다", () => {
  assert.equal(canCustomerChangeQuoteRequest(QuoteRequestStatus.OPEN), true);
  assert.equal(canCustomerChangeQuoteRequest(QuoteRequestStatus.MATCHED), false);
  assert.equal(canCustomerChangeQuoteRequest(QuoteRequestStatus.CLOSED), false);
  assert.equal(canCustomerChangeQuoteRequest(QuoteRequestStatus.CANCELLED), false);
});

test("고객 견적 요청 입력은 필수 값과 예산 범위를 서버에서 검증한다", () => {
  const validRequest = {
    categorySlug: "plumbing",
    title: "Kitchen sink leak",
    description: "Water is leaking under the kitchen sink.",
    city: "Dagupan",
    addressLine: "Arellano Street",
    budgetMin: 1000,
    budgetMax: 2500,
    targetDate: "2026-08-15",
  };

  assert.equal(quoteRequestSchema.safeParse(validRequest).success, true);

  assert.equal(
    quoteRequestSchema.safeParse({
      ...validRequest,
      targetDate: " 2026-08-15 ",
    }).success,
    true,
  );

  assert.equal(
    quoteRequestSchema.safeParse({
      ...validRequest,
      targetDate: "2026/8/15",
    }).success,
    true,
  );

  assert.equal(
    quoteRequestSchema.safeParse({
      ...validRequest,
      targetDate: "20260815",
    }).success,
    true,
  );

  assert.equal(
    quoteRequestSchema.safeParse({
      ...validRequest,
      targetDate: "2026.08.15",
    }).success,
    true,
  );

  assert.equal(
    quoteRequestSchema.safeParse({
      ...validRequest,
      categorySlug: "",
    }).success,
    false,
  );

  assert.equal(
    quoteRequestSchema.safeParse({
      ...validRequest,
      addressLine: "",
    }).success,
    false,
  );

  assert.equal(
    quoteRequestSchema.safeParse({
      ...validRequest,
      budgetMin: 3000,
      budgetMax: 1000,
    }).success,
    false,
  );

  assert.equal(
    quoteRequestSchema.safeParse({
      ...validRequest,
      targetDate: "15-08-2026",
    }).success,
    false,
  );

  assert.equal(
    quoteRequestSchema.safeParse({
      ...validRequest,
      targetDate: "2026-02-31",
    }).success,
    false,
  );
});

test("전문가 견적 입력은 금액, 요청 ID, 고객 메시지를 서버에서 검증한다", () => {
  const validQuote = {
    quoteRequestId: "quote_request_1",
    amount: 1500,
    visitDate: "2026-08-15T09:30",
    message: "I can visit tomorrow morning and inspect the aircon before repair.",
  };

  assert.equal(tradesmanQuoteSchema.safeParse(validQuote).success, true);

  assert.equal(
    tradesmanQuoteSchema.safeParse({
      ...validQuote,
      quoteRequestId: "",
    }).success,
    false,
  );

  assert.equal(
    tradesmanQuoteSchema.safeParse({
      ...validQuote,
      amount: 99,
    }).success,
    false,
  );

  assert.equal(
    tradesmanQuoteSchema.safeParse({
      ...validQuote,
      amount: 1_000_001,
    }).success,
    false,
  );

  assert.equal(
    tradesmanQuoteSchema.safeParse({
      ...validQuote,
      message: "Too short",
    }).success,
    false,
  );
});

test("관리자 전문가 승인 입력은 프로필 ID와 정해진 승인 상태만 허용한다", () => {
  assert.equal(
    adminExpertApprovalCreateSchema.safeParse({
      profileId: "profile_1",
      status: "APPROVED",
      reviewNote: "Documents look valid.",
    }).success,
    true,
  );

  assert.equal(
    adminExpertApprovalCreateSchema.safeParse({
      profileId: "",
      status: "APPROVED",
      reviewNote: "Documents look valid.",
    }).success,
    false,
  );

  assert.equal(
    adminExpertApprovalCreateSchema.safeParse({
      profileId: "profile_1",
      status: "REJECTED",
      reviewNote: "",
    }).success,
    false,
  );

  assert.equal(
    adminExpertApprovalCreateSchema.safeParse({
      profileId: "profile_1",
      status: "INVALID_STATUS",
      reviewNote: "Documents look valid.",
    }).success,
    false,
  );
});

test("회원탈퇴 요청은 확인 문구 DELETE와 짧은 사유만 허용한다", () => {
  assert.equal(
    accountDeletionRequestSchema.safeParse({
      reason: "I no longer need this account.",
      confirmText: "DELETE",
    }).success,
    true,
  );

  assert.equal(
    accountDeletionRequestSchema.safeParse({
      reason: "I no longer need this account.",
      confirmText: "delete",
    }).success,
    false,
  );

  assert.equal(
    accountDeletionRequestSchema.safeParse({
      reason: "x".repeat(1001),
      confirmText: "DELETE",
    }).success,
    false,
  );
});

test("관리자 회원탈퇴 검토는 요청 ID와 완료/취소 상태만 허용한다", () => {
  assert.equal(
    adminAccountDeletionReviewSchema.safeParse({
      requestId: "deletion_request_1",
      status: "COMPLETED",
      reviewNote: "Reviewed and completed.",
    }).success,
    true,
  );

  assert.equal(
    adminAccountDeletionReviewSchema.safeParse({
      requestId: "deletion_request_1",
      status: "APPROVED",
    }).success,
    false,
  );

  assert.equal(
    adminAccountDeletionReviewSchema.safeParse({
      requestId: "",
      status: "CANCELLED",
    }).success,
    false,
  );
});

test("예약 취소는 PENDING/ACCEPTED에서 관련 사용자 또는 admin에게 열린다", () => {
  assert.equal(
    canCancelBooking({ status: BookingStatus.PENDING, actorRole: "customer" }),
    true,
  );
  assert.equal(
    canCancelBooking({ status: BookingStatus.ACCEPTED, actorRole: "tradesman" }),
    true,
  );
  assert.equal(
    canCancelBooking({ status: BookingStatus.ACCEPTED, actorRole: "admin" }),
    true,
  );
});

test("진행 중 예약은 admin만 취소할 수 있고, 완료/취소 예약은 다시 취소할 수 없다", () => {
  assert.equal(
    canCancelBooking({ status: BookingStatus.IN_PROGRESS, actorRole: "customer" }),
    false,
  );
  assert.equal(
    canCancelBooking({ status: BookingStatus.IN_PROGRESS, actorRole: "tradesman" }),
    false,
  );
  assert.equal(
    canCancelBooking({ status: BookingStatus.IN_PROGRESS, actorRole: "admin" }),
    true,
  );
  assert.equal(
    canCancelBooking({ status: BookingStatus.COMPLETED, actorRole: "admin" }),
    false,
  );
  assert.equal(
    canCancelBooking({ status: BookingStatus.CANCELLED, actorRole: "admin" }),
    false,
  );
});
