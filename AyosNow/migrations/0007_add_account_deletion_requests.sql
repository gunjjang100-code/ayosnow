-- Store user account deletion requests for admin review.
CREATE TABLE IF NOT EXISTS "AccountDeletionRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "reviewerAdminId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" DATETIME,
  "reviewNote" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccountDeletionRequest_reviewerAdminId_fkey" FOREIGN KEY ("reviewerAdminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AccountDeletionRequest_userId_status_requestedAt_idx"
ON "AccountDeletionRequest" ("userId", "status", "requestedAt");

CREATE INDEX IF NOT EXISTS "AccountDeletionRequest_status_requestedAt_idx"
ON "AccountDeletionRequest" ("status", "requestedAt");
