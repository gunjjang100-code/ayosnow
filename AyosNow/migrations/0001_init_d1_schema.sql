-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "roleSelectedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "city" TEXT,
    "barangay" TEXT,
    "avatarUrl" TEXT,
    "lastSeenAt" DATETIME,
    "referralCode" TEXT,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rewardCredits" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReferralSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "rewardCredits" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GRANTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralReward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferralReward_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradesmanProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "serviceRadiusKm" INTEGER NOT NULL DEFAULT 10,
    "averageRating" REAL NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "responseRate" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "oneOutStrikeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradesmanProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "acquiredAt" DATETIME,
    "expiresAt" DATETIME,
    CONSTRAINT "Certification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TradesmanProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TradesmanProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "nameKo" TEXT,
    "nameFil" TEXT,
    "nameEn" TEXT,
    "descriptionKo" TEXT,
    "descriptionFil" TEXT,
    "descriptionEn" TEXT,
    "iconName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceCategory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradesmanSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "years" INTEGER NOT NULL DEFAULT 1,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TradesmanSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TradesmanProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradesmanSkill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "basePriceMin" INTEGER NOT NULL,
    "basePriceMax" INTEGER NOT NULL,
    "serviceArea" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "durationMinutes" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "targetDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "selectedQuoteId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteRequestId" TEXT NOT NULL,
    "tradesmanId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "visitDate" DATETIME,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_tradesmanId_fkey" FOREIGN KEY ("tradesmanId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "tradesmanId" TEXT NOT NULL,
    "serviceId" TEXT,
    "quoteRequestId" TEXT,
    "quoteId" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "finalAmount" INTEGER NOT NULL,
    "workAddress" TEXT NOT NULL,
    "completionNote" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_tradesmanId_fkey" FOREIGN KEY ("tradesmanId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "withdrawableBalance" INTEGER NOT NULL DEFAULT 0,
    "holdBalance" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "quoteRequestId" TEXT,
    "walletTopupPaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "memo" TEXT,
    "referenceKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreditTransaction_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CreditTransaction_walletTopupPaymentId_fkey" FOREIGN KEY ("walletTopupPaymentId") REFERENCES "WalletTopupPayment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WalletTopupPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "checkoutSessionId" TEXT,
    "checkoutUrl" TEXT,
    "providerPaymentId" TEXT,
    "paidEventId" TEXT,
    "refundedEventId" TEXT,
    "failureMessage" TEXT,
    "paidAt" DATETIME,
    "creditedAt" DATETIME,
    "refundedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletTopupPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "tradesmanId" TEXT NOT NULL,
    "quoteId" TEXT,
    "bookingId" TEXT,
    "requestId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_tradesmanId_fkey" FOREIGN KEY ("tradesmanId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conversation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conversation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuoteRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderRole" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileMimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TypingIndicator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TypingIndicator_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TypingIndicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "assignedAdminId" TEXT,
    "reason" TEXT NOT NULL,
    "resolutionNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dispute_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformCommissionRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'PLATFORM',
    "feeType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "value" INTEGER NOT NULL,
    "categoryId" TEXT,
    "serviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATETIME,
    "effectiveTo" DATETIME,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlatformCommissionRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlatformCommissionRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlatformCommissionRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminBanner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleKo" TEXT NOT NULL,
    "titleFil" TEXT NOT NULL,
    "descriptionKo" TEXT,
    "descriptionFil" TEXT,
    "ctaLabelKo" TEXT,
    "ctaLabelFil" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminBanner_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminBanner_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminNotice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleKo" TEXT NOT NULL,
    "titleFil" TEXT NOT NULL,
    "contentKo" TEXT NOT NULL,
    "contentFil" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminNotice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminNotice_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradesmanApprovalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "reviewerAdminId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedNote" TEXT,
    "reviewNote" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradesmanApprovalRequest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TradesmanProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradesmanApprovalRequest_reviewerAdminId_fkey" FOREIGN KEY ("reviewerAdminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OneOutCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "bookingId" TEXT,
    "disputeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "strikeCountApplied" INTEGER NOT NULL DEFAULT 1,
    "suspensionUntil" DATETIME,
    "adminNote" TEXT,
    "handledById" TEXT,
    "handledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OneOutCase_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TradesmanProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OneOutCase_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OneOutCase_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OneOutCase_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- CreateIndex
CREATE INDEX "ReferralReward_referrerId_status_idx" ON "ReferralReward"("referrerId", "status");

-- CreateIndex
CREATE INDEX "ReferralReward_referredUserId_idx" ON "ReferralReward"("referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_referrerId_referredUserId_key" ON "ReferralReward"("referrerId", "referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TradesmanProfile_userId_key" ON "TradesmanProfile"("userId");

-- CreateIndex
CREATE INDEX "TradesmanProfile_isVerified_averageRating_idx" ON "TradesmanProfile"("isVerified", "averageRating");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_isActive_name_idx" ON "ServiceCategory"("isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TradesmanSkill_profileId_categoryId_key" ON "TradesmanSkill"("profileId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_categoryId_isPublished_idx" ON "Service"("categoryId", "isPublished");

-- CreateIndex
CREATE INDEX "Service_ownerId_isPublished_idx" ON "Service"("ownerId", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_selectedQuoteId_key" ON "QuoteRequest"("selectedQuoteId");

-- CreateIndex
CREATE INDEX "QuoteRequest_customerId_status_idx" ON "QuoteRequest"("customerId", "status");

-- CreateIndex
CREATE INDEX "QuoteRequest_categoryId_status_targetDate_idx" ON "QuoteRequest"("categoryId", "status", "targetDate");

-- CreateIndex
CREATE INDEX "Quote_tradesmanId_status_idx" ON "Quote"("tradesmanId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteRequestId_tradesmanId_key" ON "Quote"("quoteRequestId", "tradesmanId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quoteRequestId_key" ON "Booking"("quoteRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quoteId_key" ON "Booking"("quoteId");

-- CreateIndex
CREATE INDEX "Booking_customerId_status_scheduledAt_idx" ON "Booking"("customerId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Booking_tradesmanId_status_scheduledAt_idx" ON "Booking"("tradesmanId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_channel_createdAt_idx" ON "Notification"("userId", "channel", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_createdAt_idx" ON "PushSubscription"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_referenceKey_key" ON "CreditTransaction"("referenceKey");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CreditTransaction_quoteRequestId_createdAt_idx" ON "CreditTransaction"("quoteRequestId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopupPayment_idempotencyKey_key" ON "WalletTopupPayment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopupPayment_checkoutSessionId_key" ON "WalletTopupPayment"("checkoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopupPayment_paidEventId_key" ON "WalletTopupPayment"("paidEventId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopupPayment_refundedEventId_key" ON "WalletTopupPayment"("refundedEventId");

-- CreateIndex
CREATE INDEX "WalletTopupPayment_userId_createdAt_idx" ON "WalletTopupPayment"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WalletTopupPayment_status_createdAt_idx" ON "WalletTopupPayment"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_quoteId_key" ON "Conversation"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_bookingId_key" ON "Conversation"("bookingId");

-- CreateIndex
CREATE INDEX "Conversation_customerId_updatedAt_idx" ON "Conversation"("customerId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_tradesmanId_updatedAt_idx" ON "Conversation"("tradesmanId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_requestId_updatedAt_idx" ON "Conversation"("requestId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_requestId_tradesmanId_key" ON "Conversation"("requestId", "tradesmanId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_readAt_idx" ON "Message"("conversationId", "readAt");

-- CreateIndex
CREATE INDEX "TypingIndicator_conversationId_isTyping_updatedAt_idx" ON "TypingIndicator"("conversationId", "isTyping", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TypingIndicator_conversationId_userId_key" ON "TypingIndicator"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Review_targetUserId_rating_idx" ON "Review"("targetUserId", "rating");

-- CreateIndex
CREATE INDEX "Dispute_status_createdAt_idx" ON "Dispute"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformCommissionRule_scope_isActive_idx" ON "PlatformCommissionRule"("scope", "isActive");

-- CreateIndex
CREATE INDEX "PlatformCommissionRule_categoryId_isActive_idx" ON "PlatformCommissionRule"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "PlatformCommissionRule_serviceId_isActive_idx" ON "PlatformCommissionRule"("serviceId", "isActive");

-- CreateIndex
CREATE INDEX "AdminBanner_status_displayOrder_idx" ON "AdminBanner"("status", "displayOrder");

-- CreateIndex
CREATE INDEX "AdminNotice_status_isPinned_idx" ON "AdminNotice"("status", "isPinned");

-- CreateIndex
CREATE INDEX "TradesmanApprovalRequest_status_submittedAt_idx" ON "TradesmanApprovalRequest"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "OneOutCase_profileId_status_idx" ON "OneOutCase"("profileId", "status");
