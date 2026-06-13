ALTER TABLE "User" ADD COLUMN "roleSelectedAt" TIMESTAMP(3);

UPDATE "User"
SET "roleSelectedAt" = "createdAt"
WHERE "roleSelectedAt" IS NULL;
