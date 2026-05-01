import test from "node:test";
import assert from "node:assert/strict";

import { isAllowedMutationOrigin } from "../src/lib/auth/csrf.ts";
import { buildQuoteSubmissionFeeReferenceKey } from "../src/lib/wallets/wallet-topup-config.ts";

test("운영 환경 mutation API는 같은 Origin 요청만 허용한다", () => {
  assert.equal(
    isAllowedMutationOrigin({
      method: "POST",
      origin: "https://ayosnow.com",
      host: "ayosnow.com",
      nodeEnv: "production",
    }),
    true,
  );

  assert.equal(
    isAllowedMutationOrigin({
      method: "POST",
      origin: "https://evil.example",
      host: "ayosnow.com",
      nodeEnv: "production",
    }),
    false,
  );

  assert.equal(
    isAllowedMutationOrigin({
      method: "POST",
      origin: null,
      host: "ayosnow.com",
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
      host: "ayosnow.com",
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
