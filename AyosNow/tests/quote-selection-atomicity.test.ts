import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { QuoteRequestStatus, QuoteStatus, UserRole } from "@prisma/client";

const quotesServiceSource = readFileSync(
  new URL("../src/lib/quotes/service.ts", import.meta.url),
  "utf8",
);

const prismaSchemaSource = readFileSync(
  new URL("../prisma/schema.prisma", import.meta.url),
  "utf8",
);

test("quote acceptance workflow uses one atomic D1 batch", () => {
  const functionStart = quotesServiceSource.indexOf(
    "export async function selectQuoteForCustomer",
  );
  const nextFunctionStart = quotesServiceSource.indexOf(
    "export async function rejectQuoteForCustomer",
  );
  const selectQuoteSource = quotesServiceSource.slice(functionStart, nextFunctionStart);

  assert.notEqual(functionStart, -1);
  assert.notEqual(nextFunctionStart, -1);
  assert.match(selectQuoteSource, /executeAtomicD1Batch\(/);
  assert.match(selectQuoteSource, /buildQuoteSelectionBatch\(/);
  assert.doesNotMatch(selectQuoteSource, /prisma\.\$transaction/);
  assert.doesNotMatch(selectQuoteSource, /prisma\.\$executeRaw/);
});

test("quote acceptance uses D1-compatible batch transactions, not interactive transactions", () => {
  const functionStart = quotesServiceSource.indexOf(
    "export async function selectQuoteForCustomer",
  );
  const nextFunctionStart = quotesServiceSource.indexOf(
    "export async function rejectQuoteForCustomer",
  );
  const selectQuoteSource = quotesServiceSource.slice(functionStart, nextFunctionStart);

  assert.match(selectQuoteSource, /executeAtomicD1Batch/);
  assert.doesNotMatch(selectQuoteSource, /\$transaction/);
  assert.match(selectQuoteSource, /shouldSendExternalNotifications/);
});

test("accepted quote conversation helper finds existing booking or quote conversations", () => {
  const helperStart = quotesServiceSource.indexOf(
    "async function findAcceptedQuoteConversation",
  );
  const nextFunctionStart = quotesServiceSource.indexOf(
    "export async function listQuoteWorkspaceForCustomer",
  );
  const helperSource = quotesServiceSource.slice(helperStart, nextFunctionStart);

  assert.notEqual(helperStart, -1);
  assert.notEqual(nextFunctionStart, -1);
  assert.match(helperSource, /prisma\.conversation\.findFirst/);
  assert.match(helperSource, /bookingId: params\.bookingId/);
  assert.match(helperSource, /quoteId: params\.quoteId/);
  assert.match(helperSource, /requestId: params\.quoteRequestId/);
});

test("database schema prevents duplicate booking and chat records per accepted quote", () => {
  assert.match(prismaSchemaSource, /quoteRequestId String\?\s+@unique/);
  assert.match(prismaSchemaSource, /quoteId\s+String\?\s+@unique/);
  assert.match(prismaSchemaSource, /bookingId\s+String\?\s+@unique/);
  assert.match(prismaSchemaSource, /@@unique\(\[requestId, tradesmanId\]\)/);
});

test(
  "D1 E2E: selecting a quote creates exactly one booking and one chat room",
  { skip: process.env.RUN_D1_E2E !== "1" },
  async () => {
    const { prisma } = await import("../src/lib/prisma.ts");
    const { selectQuoteForCustomer } = await import("../src/lib/quotes/service.ts");

    const runId = `atomic-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const categorySlug = `qa-${runId}`;
    const customerEmail = `${runId}-customer@puntago.test`;
    const otherCustomerEmail = `${runId}-other@puntago.test`;
    const tradesmanEmail = `${runId}-pro@puntago.test`;
    const unverifiedTradesmanEmail = `${runId}-unverified@puntago.test`;

    let customerId = "";
    let otherCustomerId = "";
    let tradesmanId = "";
    let unverifiedTradesmanId = "";
    let categoryId = "";

    try {
      const category = await prisma.serviceCategory.create({
        data: {
          slug: categorySlug,
          name: `QA Atomic ${runId}`,
          description: "Temporary category for quote atomicity testing.",
          isActive: true,
        },
      });
      categoryId = category.id;

      const customer = await prisma.user.create({
        data: {
          email: customerEmail,
          passwordHash: "qa-only",
          fullName: "QA Atomic Customer",
          role: UserRole.CUSTOMER,
          roleSelectedAt: new Date(),
          city: "Dagupan",
        },
      });
      customerId = customer.id;

      const otherCustomer = await prisma.user.create({
        data: {
          email: otherCustomerEmail,
          passwordHash: "qa-only",
          fullName: "QA Atomic Other Customer",
          role: UserRole.CUSTOMER,
          roleSelectedAt: new Date(),
          city: "Dagupan",
        },
      });
      otherCustomerId = otherCustomer.id;

      const tradesman = await prisma.user.create({
        data: {
          email: tradesmanEmail,
          passwordHash: "qa-only",
          fullName: "QA Atomic Professional",
          role: UserRole.TRADESMAN,
          roleSelectedAt: new Date(),
          city: "Dagupan",
          tradesmanProfile: {
            create: {
              headline: "Verified QA professional",
              bio: "Used only for atomic quote acceptance verification.",
              experienceYears: 3,
              isVerified: true,
              identityVerifiedAt: new Date(),
            },
          },
        },
      });
      tradesmanId = tradesman.id;

      const unverifiedTradesman = await prisma.user.create({
        data: {
          email: unverifiedTradesmanEmail,
          passwordHash: "qa-only",
          fullName: "QA Atomic Unverified Professional",
          role: UserRole.TRADESMAN,
          roleSelectedAt: new Date(),
          city: "Dagupan",
          tradesmanProfile: {
            create: {
              headline: "Unverified QA professional",
              bio: "Used only for failed atomic quote acceptance verification.",
              experienceYears: 1,
              isVerified: false,
            },
          },
        },
      });
      unverifiedTradesmanId = unverifiedTradesman.id;

      const request = await prisma.quoteRequest.create({
        data: {
          customerId,
          categoryId,
          title: `Atomic booking request ${runId}`,
          description: "Please verify atomic quote acceptance.",
          city: "Dagupan",
          addressLine: "QA Street",
          budgetMin: 1000,
          budgetMax: 2000,
          targetDate: new Date(Date.now() + 86_400_000),
        },
      });

      const acceptedQuote = await prisma.quote.create({
        data: {
          quoteRequestId: request.id,
          tradesmanId,
          amount: 1500,
          visitDate: new Date(Date.now() + 172_800_000),
          message: "I can complete this QA job.",
        },
      });

      const rejectedQuoteOwner = await prisma.user.create({
        data: {
          email: `${runId}-rejected-pro@puntago.test`,
          passwordHash: "qa-only",
          fullName: "QA Rejected Professional",
          role: UserRole.TRADESMAN,
          roleSelectedAt: new Date(),
          city: "Dagupan",
          tradesmanProfile: {
            create: {
              headline: "Rejected QA professional",
              bio: "Used only for quote status verification.",
              experienceYears: 2,
              isVerified: true,
              identityVerifiedAt: new Date(),
            },
          },
        },
      });

      const rejectedQuote = await prisma.quote.create({
        data: {
          quoteRequestId: request.id,
          tradesmanId: rejectedQuoteOwner.id,
          amount: 1700,
          visitDate: new Date(Date.now() + 172_800_000),
          message: "This quote should be rejected after another quote is accepted.",
        },
      });

      const firstResult = await selectQuoteForCustomer({
        quoteId: acceptedQuote.id,
        customerId,
      });
      const retryResult = await selectQuoteForCustomer({
        quoteId: acceptedQuote.id,
        customerId,
      });

      assert.equal(retryResult.bookingId, firstResult.bookingId);
      assert.equal(retryResult.conversationId, firstResult.conversationId);

      const [bookingCount, conversationCount, systemMessageCount, inAppNotificationCount] =
        await Promise.all([
          prisma.booking.count({ where: { quoteId: acceptedQuote.id } }),
          prisma.conversation.count({ where: { bookingId: firstResult.bookingId } }),
          prisma.message.count({
            where: {
              conversationId: firstResult.conversationId,
              messageType: "SYSTEM",
            },
          }),
          prisma.notification.count({
            where: {
              relatedId: firstResult.bookingId,
              channel: "IN_APP",
            },
          }),
        ]);

      assert.equal(bookingCount, 1);
      assert.equal(conversationCount, 1);
      assert.equal(systemMessageCount, 2);
      assert.equal(inAppNotificationCount, 2);

      const updatedRequest = await prisma.quoteRequest.findUniqueOrThrow({
        where: { id: request.id },
      });
      const updatedAcceptedQuote = await prisma.quote.findUniqueOrThrow({
        where: { id: acceptedQuote.id },
      });
      const updatedRejectedQuote = await prisma.quote.findUniqueOrThrow({
        where: { id: rejectedQuote.id },
      });

      assert.equal(updatedRequest.status, QuoteRequestStatus.MATCHED);
      assert.equal(updatedRequest.selectedQuoteId, acceptedQuote.id);
      assert.equal(updatedAcceptedQuote.status, QuoteStatus.ACCEPTED);
      assert.equal(updatedRejectedQuote.status, QuoteStatus.REJECTED);

      const wrongCustomerRequest = await prisma.quoteRequest.create({
        data: {
          customerId,
          categoryId,
          title: `Wrong customer request ${runId}`,
          description: "This request should not be accepted by another customer.",
          city: "Dagupan",
          addressLine: "QA Street",
        },
      });
      const wrongCustomerQuote = await prisma.quote.create({
        data: {
          quoteRequestId: wrongCustomerRequest.id,
          tradesmanId,
          amount: 1600,
          message: "Wrong customer should not accept this quote.",
        },
      });

      await assert.rejects(
        () =>
          selectQuoteForCustomer({
            quoteId: wrongCustomerQuote.id,
            customerId: otherCustomerId,
          }),
        /permission/,
      );
      assert.equal(
        await prisma.booking.count({ where: { quoteId: wrongCustomerQuote.id } }),
        0,
      );

      const unverifiedRequest = await prisma.quoteRequest.create({
        data: {
          customerId,
          categoryId,
          title: `Unverified pro request ${runId}`,
          description: "This quote should fail because the professional is not verified.",
          city: "Dagupan",
          addressLine: "QA Street",
        },
      });
      const unverifiedQuote = await prisma.quote.create({
        data: {
          quoteRequestId: unverifiedRequest.id,
          tradesmanId: unverifiedTradesmanId,
          amount: 1600,
          message: "Unverified professional should not be bookable.",
        },
      });

      await assert.rejects(
        () =>
          selectQuoteForCustomer({
            quoteId: unverifiedQuote.id,
            customerId,
          }),
        /not verified/,
      );
      assert.equal(
        await prisma.booking.count({ where: { quoteId: unverifiedQuote.id } }),
        0,
      );

      const preChatRequest = await prisma.quoteRequest.create({
        data: {
          customerId,
          categoryId,
          title: `Pre-chat request ${runId}`,
          description: "This request already has a quote conversation.",
          city: "Dagupan",
          addressLine: "QA Street",
        },
      });
      const preChatQuote = await prisma.quote.create({
        data: {
          quoteRequestId: preChatRequest.id,
          tradesmanId,
          amount: 1800,
          message: "Use the existing quote conversation.",
        },
      });
      const existingConversation = await prisma.conversation.create({
        data: {
          customerId,
          tradesmanId,
          quoteId: preChatQuote.id,
          requestId: preChatRequest.id,
        },
      });

      const preChatResult = await selectQuoteForCustomer({
        quoteId: preChatQuote.id,
        customerId,
      });

      assert.equal(preChatResult.conversationId, existingConversation.id);
      assert.equal(
        await prisma.conversation.count({ where: { quoteId: preChatQuote.id } }),
        1,
      );
      assert.equal(
        await prisma.booking.count({ where: { quoteId: preChatQuote.id } }),
        1,
      );
    } finally {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: runId,
          },
        },
      });
      await prisma.serviceCategory.deleteMany({
        where: {
          slug: categorySlug,
        },
      });
    }
  },
);
