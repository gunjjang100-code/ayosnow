-- Keep every promotional-video save as an immutable settings snapshot.
CREATE TABLE "PromotionalVideoSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "video1Url" TEXT,
  "video2Url" TEXT,
  "video3Url" TEXT,
  "updatedById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromotionalVideoSetting_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "PromotionalVideoSetting_createdAt_idx"
ON "PromotionalVideoSetting" ("createdAt" DESC);
