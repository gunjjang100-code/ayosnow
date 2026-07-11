-- Payment policy acceptance for wallet top-up transactions.
-- 가입 동의와 실제 결제 동의를 분리해서, 돈이 움직이는 순간의 동의 기록을 남긴다.

ALTER TABLE "WalletTopupPayment"
ADD COLUMN "acceptedPaymentPolicy" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "WalletTopupPayment"
ADD COLUMN "paymentPolicyVersion" TEXT;

ALTER TABLE "WalletTopupPayment"
ADD COLUMN "paymentPolicyAcceptedAt" DATETIME;

ALTER TABLE "WalletTopupPayment"
ADD COLUMN "paymentPolicyIpAddress" TEXT;

ALTER TABLE "WalletTopupPayment"
ADD COLUMN "paymentPolicyUserAgent" TEXT;

CREATE INDEX IF NOT EXISTS "WalletTopupPayment_paymentPolicyVersion_idx"
ON "WalletTopupPayment"("paymentPolicyVersion");
