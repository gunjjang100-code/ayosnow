-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'FILE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message"
ADD COLUMN "fileUrl" TEXT,
ADD COLUMN "fileName" TEXT,
ADD COLUMN "fileMimeType" TEXT,
ADD COLUMN "fileSizeBytes" INTEGER;

-- CreateTable
CREATE TABLE "TypingIndicator" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypingIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TypingIndicator_conversationId_userId_key" ON "TypingIndicator"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "TypingIndicator_conversationId_isTyping_updatedAt_idx" ON "TypingIndicator"("conversationId", "isTyping", "updatedAt");

-- AddForeignKey
ALTER TABLE "TypingIndicator" ADD CONSTRAINT "TypingIndicator_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypingIndicator" ADD CONSTRAINT "TypingIndicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
