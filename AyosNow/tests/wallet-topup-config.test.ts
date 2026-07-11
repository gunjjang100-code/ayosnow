import test from "node:test";
import assert from "node:assert/strict";

import {
  QUOTE_SUBMISSION_CREDIT_COST,
  WALLET_TOPUP_PACKAGES,
  isSupportedWalletTopupAmount,
} from "../src/lib/wallets/wallet-topup-config.ts";

test("견적 제출 기본 수수료는 40 PHP다", () => {
  assert.equal(QUOTE_SUBMISSION_CREDIT_COST, 40);
});

test("허용된 충전 패키지는 200 / 400 / 800 PHP다", () => {
  assert.deepEqual(WALLET_TOPUP_PACKAGES, [200, 400, 800]);
  assert.equal(isSupportedWalletTopupAmount(200), true);
  assert.equal(isSupportedWalletTopupAmount(400), true);
  assert.equal(isSupportedWalletTopupAmount(800), true);
  assert.equal(isSupportedWalletTopupAmount(500), false);
});
