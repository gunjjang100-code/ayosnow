-- Add reusable professional badge settings, badge state, and badge history.
-- Existing approved professionals are treated as identity-verified because
-- the previous approval flow already represented an admin document review.
ALTER TABLE "TradesmanProfile" ADD COLUMN "identityVerifiedAt" DATETIME;
ALTER TABLE "TradesmanProfile" ADD COLUMN "identityVerifiedById" TEXT;

UPDATE "TradesmanProfile"
SET "identityVerifiedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "isVerified" = 1 AND "identityVerifiedAt" IS NULL;

CREATE TABLE "ProfessionalBadgeSetting" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
  "badgesEnabled" BOOLEAN NOT NULL DEFAULT true,
  "verifiedBadgeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "topBadgeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "topMinCompletedBookings" INTEGER NOT NULL DEFAULT 10,
  "topMinAverageRating" REAL NOT NULL DEFAULT 4.7,
  "topMinResponseRate" INTEGER NOT NULL DEFAULT 90,
  "topMaxCancellationRate" INTEGER NOT NULL DEFAULT 5,
  "updatedById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "ProfessionalBadgeSetting" ("id")
VALUES ('global')
ON CONFLICT("id") DO NOTHING;

CREATE TABLE "ProfessionalBadge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profileId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'AUTO',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isManuallyRemoved" BOOLEAN NOT NULL DEFAULT false,
  "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "removedAt" DATETIME,
  "removedById" TEXT,
  "removedReason" TEXT,
  "lastCalculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfessionalBadge_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "TradesmanProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProfessionalBadge_profileId_code_key"
ON "ProfessionalBadge" ("profileId", "code");

CREATE INDEX "ProfessionalBadge_profileId_isActive_idx"
ON "ProfessionalBadge" ("profileId", "isActive");

CREATE INDEX "ProfessionalBadge_code_isActive_idx"
ON "ProfessionalBadge" ("code", "isActive");

INSERT INTO "ProfessionalBadge" (
  "id",
  "profileId",
  "code",
  "source",
  "isActive",
  "isManuallyRemoved",
  "awardedAt",
  "lastCalculatedAt"
)
SELECT
  lower(hex(randomblob(16))),
  "id",
  'VERIFIED_PROFESSIONAL',
  'AUTO',
  true,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "TradesmanProfile"
WHERE "isVerified" = 1 AND "identityVerifiedAt" IS NOT NULL;

CREATE TABLE "ProfessionalBadgeHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profileId" TEXT NOT NULL,
  "badgeId" TEXT,
  "code" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorAdminId" TEXT,
  "reason" TEXT,
  "snapshotText" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfessionalBadgeHistory_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "TradesmanProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ProfessionalBadgeHistory_profileId_createdAt_idx"
ON "ProfessionalBadgeHistory" ("profileId", "createdAt");

CREATE INDEX "ProfessionalBadgeHistory_code_action_createdAt_idx"
ON "ProfessionalBadgeHistory" ("code", "action", "createdAt");
