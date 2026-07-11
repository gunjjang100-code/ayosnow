import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import {
  buildQuoteSelectionBatch,
  type QuoteSelectionBatchInput,
} from "../src/lib/quotes/quote-selection-batch.ts";

function createDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE "QuoteRequest" (
      "id" TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "selectedQuoteId" TEXT,
      "updatedAt" TEXT NOT NULL
    );
    CREATE TABLE "Quote" (
      "id" TEXT PRIMARY KEY,
      "quoteRequestId" TEXT NOT NULL,
      "tradesmanId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );
    CREATE TABLE "TradesmanProfile" (
      "userId" TEXT PRIMARY KEY,
      "isVerified" INTEGER NOT NULL
    );
    CREATE TABLE "Booking" (
      "id" TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL,
      "tradesmanId" TEXT NOT NULL,
      "quoteRequestId" TEXT UNIQUE,
      "quoteId" TEXT UNIQUE,
      "scheduledAt" TEXT NOT NULL,
      "finalAmount" INTEGER NOT NULL,
      "workAddress" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );
    CREATE TABLE "Conversation" (
      "id" TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL,
      "tradesmanId" TEXT NOT NULL,
      "quoteId" TEXT UNIQUE,
      "bookingId" TEXT UNIQUE,
      "requestId" TEXT,
      "updatedAt" TEXT NOT NULL,
      UNIQUE("requestId", "tradesmanId")
    );
    CREATE TABLE "Message" (
      "id" TEXT PRIMARY KEY,
      "conversationId" TEXT NOT NULL,
      "senderRole" TEXT NOT NULL,
      "messageType" TEXT NOT NULL,
      "content" TEXT NOT NULL
    );
    CREATE TABLE "Notification" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "relatedId" TEXT,
      "relatedType" TEXT,
      "channel" TEXT NOT NULL
    );
  `);

  return database;
}

function seedRequest(database: DatabaseSync) {
  const now = "2026-07-12T00:00:00.000Z";
  database.prepare(
    `INSERT INTO "QuoteRequest" VALUES (?, ?, ?, 'OPEN', NULL, ?)`,
  ).run("request-1", "customer-1", "Aircon repair", now);
  database.prepare(
    `INSERT INTO "TradesmanProfile" VALUES (?, 1)`,
  ).run("professional-1");
  database.prepare(
    `INSERT INTO "TradesmanProfile" VALUES (?, 1)`,
  ).run("professional-2");
  database.prepare(
    `INSERT INTO "Quote" VALUES (?, ?, ?, 'PENDING', ?)`,
  ).run("quote-1", "request-1", "professional-1", now);
  database.prepare(
    `INSERT INTO "Quote" VALUES (?, ?, ?, 'PENDING', ?)`,
  ).run("quote-2", "request-1", "professional-2", now);
}

function makeInput(overrides: Partial<QuoteSelectionBatchInput> = {}) {
  return {
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
    now: "2026-07-12T00:00:00.000Z",
    selectedMessageId: "message-selected-1",
    bookingMessageId: "message-booking-1",
    tradesmanNotificationId: "notification-professional-1",
    customerNotificationId: "notification-customer-1",
    ...overrides,
  } satisfies QuoteSelectionBatchInput;
}

function runAsTransaction(
  database: DatabaseSync,
  input: QuoteSelectionBatchInput,
  finalSql?: string,
) {
  database.exec("BEGIN IMMEDIATE");

  try {
    for (const statement of buildQuoteSelectionBatch(input)) {
      database.prepare(statement.sql).run(...(statement.params ?? []));
    }
    if (finalSql) {
      database.exec(finalSql);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function count(database: DatabaseSync, table: string) {
  return Number(
    (database.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get() as {
      count: number;
    }).count,
  );
}

test("atomic quote selection creates one complete booking workflow", () => {
  const database = createDatabase();
  seedRequest(database);

  runAsTransaction(database, makeInput());

  assert.deepEqual(
    { ...database.prepare(
      `SELECT "status", "selectedQuoteId" FROM "QuoteRequest" WHERE "id" = 'request-1'`,
    ).get() },
    { status: "MATCHED", selectedQuoteId: "quote-1" },
  );
  assert.equal(count(database, "Booking"), 1);
  assert.equal(count(database, "Conversation"), 1);
  assert.equal(count(database, "Message"), 2);
  assert.equal(count(database, "Notification"), 2);
  assert.equal(
    (database.prepare(`SELECT "status" FROM "Quote" WHERE "id" = 'quote-1'`).get() as { status: string }).status,
    "ACCEPTED",
  );
  assert.equal(
    (database.prepare(`SELECT "status" FROM "Quote" WHERE "id" = 'quote-2'`).get() as { status: string }).status,
    "REJECTED",
  );
});

test("retrying the same quote does not duplicate booking, chat, messages, or alerts", () => {
  const database = createDatabase();
  seedRequest(database);
  runAsTransaction(database, makeInput());

  runAsTransaction(
    database,
    makeInput({
      bookingId: "booking-retry",
      conversationId: "conversation-retry",
      existingConversationId: "conversation-1",
      selectedMessageId: "message-selected-retry",
      bookingMessageId: "message-booking-retry",
      tradesmanNotificationId: "notification-professional-retry",
      customerNotificationId: "notification-customer-retry",
    }),
  );

  assert.equal(count(database, "Booking"), 1);
  assert.equal(count(database, "Conversation"), 1);
  assert.equal(count(database, "Message"), 2);
  assert.equal(count(database, "Notification"), 2);
});

test("a competing quote cannot create a second booking after another quote wins", () => {
  const database = createDatabase();
  seedRequest(database);
  runAsTransaction(database, makeInput());

  runAsTransaction(
    database,
    makeInput({
      quoteId: "quote-2",
      tradesmanId: "professional-2",
      bookingId: "booking-2",
      conversationId: "conversation-2",
      selectedMessageId: "message-selected-2",
      bookingMessageId: "message-booking-2",
      tradesmanNotificationId: "notification-professional-2",
      customerNotificationId: "notification-customer-2",
    }),
  );

  assert.equal(count(database, "Booking"), 1);
  assert.equal(count(database, "Conversation"), 1);
  assert.deepEqual(
    { ...database.prepare(
      `SELECT "status", "selectedQuoteId" FROM "QuoteRequest" WHERE "id" = 'request-1'`,
    ).get() },
    { status: "MATCHED", selectedQuoteId: "quote-1" },
  );
});

test("a failure in the final statement rolls back every quote-selection change", () => {
  const database = createDatabase();
  seedRequest(database);

  assert.throws(() =>
    runAsTransaction(
      database,
      makeInput(),
      `INSERT INTO "TableThatDoesNotExist" VALUES ('force rollback')`,
    ),
  );

  assert.deepEqual(
    { ...database.prepare(
      `SELECT "status", "selectedQuoteId" FROM "QuoteRequest" WHERE "id" = 'request-1'`,
    ).get() },
    { status: "OPEN", selectedQuoteId: null },
  );
  assert.equal(count(database, "Booking"), 0);
  assert.equal(count(database, "Conversation"), 0);
  assert.equal(count(database, "Message"), 0);
  assert.equal(count(database, "Notification"), 0);
  assert.equal(
    Number(
      (database.prepare(`SELECT COUNT(*) AS count FROM "Quote" WHERE "status" = 'PENDING'`).get() as { count: number }).count,
    ),
    2,
  );
});
