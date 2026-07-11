-- Store the latest accepted Payment & Refund Policy version on the user's consent record.
-- 같은 결제 약관을 매번 묻지 않고, 버전이 바뀔 때만 다시 묻기 위한 기록이다.

ALTER TABLE "UserConsent"
ADD COLUMN "acceptedPaymentPolicyVersion" TEXT;

ALTER TABLE "UserConsent"
ADD COLUMN "acceptedPaymentPolicyAt" DATETIME;

CREATE INDEX IF NOT EXISTS "UserConsent_paymentPolicyVersion_idx"
ON "UserConsent"("acceptedPaymentPolicyVersion");
