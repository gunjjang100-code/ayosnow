-- Legal consent records.
-- One user can accept multiple future policy versions, but only once per version.

CREATE TABLE IF NOT EXISTS "UserConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "acceptedTerms" BOOLEAN NOT NULL,
    "acceptedPrivacy" BOOLEAN NOT NULL,
    "acceptedPaymentPolicy" BOOLEAN NOT NULL,
    "acceptedProfessionalPolicy" BOOLEAN NOT NULL DEFAULT false,
    "acceptedMarketing" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserConsent_userId_policyVersion_key" ON "UserConsent"("userId", "policyVersion");
CREATE INDEX IF NOT EXISTS "UserConsent_userId_acceptedAt_idx" ON "UserConsent"("userId", "acceptedAt");
CREATE INDEX IF NOT EXISTS "UserConsent_policyVersion_acceptedAt_idx" ON "UserConsent"("policyVersion", "acceptedAt");
