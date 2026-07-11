-- CreateEnum
CREATE TYPE "ReferralRewardStatus" AS ENUM ('GRANTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referredById" TEXT;

-- CreateTable
CREATE TABLE "ReferralSetting" (
    "id" TEXT NOT NULL,
    "rewardCredits" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "rewardCredits" INTEGER NOT NULL,
    "status" "ReferralRewardStatus" NOT NULL DEFAULT 'GRANTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_referrerId_referredUserId_key" ON "ReferralReward"("referrerId", "referredUserId");

-- CreateIndex
CREATE INDEX "ReferralReward_referrerId_status_idx" ON "ReferralReward"("referrerId", "status");

-- CreateIndex
CREATE INDEX "ReferralReward_referredUserId_idx" ON "ReferralReward"("referredUserId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralSetting" ADD CONSTRAINT "ReferralSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
