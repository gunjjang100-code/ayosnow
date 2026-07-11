import test from "node:test";
import assert from "node:assert/strict";

import { executeAtomicD1Batch } from "../src/lib/d1/atomic-batch.ts";
import { buildQuoteSelectionBatch } from "../src/lib/quotes/quote-selection-batch.ts";

const D1_SCHEMA = `
  CREATE TABLE "QuoteRequest" (
    "id" TEXT PRIMARY KEY, "customerId" TEXT NOT NULL, "title" TEXT NOT NULL,
    "status" TEXT NOT NULL, "selectedQuoteId" TEXT, "updatedAt" TEXT NOT NULL
  );
  CREATE TABLE "Quote" (
    "id" TEXT PRIMARY KEY, "quoteRequestId" TEXT NOT NULL, "tradesmanId" TEXT NOT NULL,
    "status" TEXT NOT NULL, "updatedAt" TEXT NOT NULL
  );
  CREATE TABLE "TradesmanProfile" (
    "userId" TEXT PRIMARY KEY, "isVerified" INTEGER NOT NULL
  );
  CREATE TABLE "Booking" (
    "id" TEXT PRIMARY KEY, "customerId" TEXT NOT NULL, "tradesmanId" TEXT NOT NULL,
    "quoteRequestId" TEXT UNIQUE, "quoteId" TEXT UNIQUE, "scheduledAt" TEXT NOT NULL,
    "finalAmount" INTEGER NOT NULL, "workAddress" TEXT NOT NULL, "status" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
  );
  CREATE TABLE "Conversation" (
    "id" TEXT PRIMARY KEY, "customerId" TEXT NOT NULL, "tradesmanId" TEXT NOT NULL,
    "quoteId" TEXT UNIQUE, "bookingId" TEXT UNIQUE, "requestId" TEXT,
    "updatedAt" TEXT NOT NULL, UNIQUE("requestId", "tradesmanId")
  );
  CREATE TABLE "Message" (
    "id" TEXT PRIMARY KEY, "conversationId" TEXT NOT NULL, "senderRole" TEXT NOT NULL,
    "messageType" TEXT NOT NULL, "content" TEXT NOT NULL
  );
  CREATE TABLE "Notification" (
    "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "type" TEXT NOT NULL,
    "title" TEXT NOT NULL, "message" TEXT NOT NULL, "relatedId" TEXT,
    "relatedType" TEXT, "channel" TEXT NOT NULL
  );
`;

test(
  "Miniflare D1 E2E: a failed batch rolls back and a retry creates one complete workflow",
  { skip: process.env.RUN_MINIFLARE_D1_E2E !== "1" },
  async () => {
    const { Miniflare } = await import("miniflare");
    const miniflare = new Miniflare({
      modules: true,
      script: `export default { fetch() { return new Response("ok"); } }`,
      d1Databases: { DB: "quote-selection-qa" },
    });

    try {
      const database = await miniflare.getD1Database("DB");
      await database.exec(D1_SCHEMA.replace(/\s+/g, " ").trim());
      const now = "2026-07-12T00:00:00.000Z";
      await database.batch([
        database
          .prepare(`INSERT INTO "QuoteRequest" VALUES (?, ?, ?, 'OPEN', NULL, ?)`)
          .bind("request-1", "customer-1", "Aircon repair", now),
        database
          .prepare(`INSERT INTO "TradesmanProfile" VALUES (?, 1)`)
          .bind("professional-1"),
        database
          .prepare(`INSERT INTO "Quote" VALUES (?, ?, ?, 'PENDING', ?)`)
          .bind("quote-1", "request-1", "professional-1", now),
      ]);

      const input = {
        quoteId: "quote-1",
        quoteRequestId: "request-1",
        customerId: "customer-1",
        tradesmanId: "professional-1",
        bookingId: "booking-1",
        conversationId: "conversation-1",
        scheduledAt: "2026-07-13T09:00:00.000Z",
        amount: 1500,
        workAddress: "Dagupan, QA Street",
        requestTitle: "Aircon repair",
        now,
        selectedMessageId: "message-selected-1",
        bookingMessageId: "message-booking-1",
        tradesmanNotificationId: "notification-professional-1",
        customerNotificationId: "notification-customer-1",
      };
      const statements = buildQuoteSelectionBatch(input);
      await assert.rejects(() =>
        executeAtomicD1Batch(
          [
            ...statements,
            {
              name: "force rollback",
              sql: `INSERT INTO "MissingTable" VALUES ('force rollback')`,
            },
          ],
          database,
        ),
      );

      const requestAfterFailure = await database
        .prepare(`SELECT "status", "selectedQuoteId" FROM "QuoteRequest" WHERE "id" = ?`)
        .bind("request-1")
        .first<{ status: string; selectedQuoteId: string | null }>();
      assert.equal(requestAfterFailure?.status, "OPEN");
      assert.equal(requestAfterFailure?.selectedQuoteId, null);
      assert.equal(
        Number(
          (
            await database
              .prepare(`SELECT COUNT(*) AS count FROM "Booking"`)
              .first<{ count: number }>()
          )?.count ?? 0,
        ),
        0,
      );

      await executeAtomicD1Batch(statements, database);
      const retryStatements = buildQuoteSelectionBatch({
        ...input,
        bookingId: "booking-retry",
        conversationId: "conversation-retry",
        existingConversationId: "conversation-1",
        selectedMessageId: "message-selected-retry",
        bookingMessageId: "message-booking-retry",
        tradesmanNotificationId: "notification-professional-retry",
        customerNotificationId: "notification-customer-retry",
      });
      await executeAtomicD1Batch(retryStatements, database);

      const counts = await Promise.all(
        ["Booking", "Conversation", "Message", "Notification"].map((table) =>
          database
            .prepare(`SELECT COUNT(*) AS count FROM "${table}"`)
            .first<{ count: number }>(),
        ),
      );
      assert.deepEqual(
        counts.map((result) => Number(result?.count ?? 0)),
        [1, 1, 2, 2],
      );
    } finally {
      await miniflare.dispose();
    }
  },
);
