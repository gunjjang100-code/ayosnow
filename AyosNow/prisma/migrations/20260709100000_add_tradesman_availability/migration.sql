CREATE TABLE "TradesmanAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '18:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradesmanAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TradesmanAvailability_userId_dayOfWeek_key" ON "TradesmanAvailability"("userId", "dayOfWeek");
CREATE INDEX "TradesmanAvailability_userId_dayOfWeek_idx" ON "TradesmanAvailability"("userId", "dayOfWeek");
