import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  buildQuoteSubmissionBatch,
  type QuoteSubmissionBatchInput,
} from "../src/lib/quotes/quote-submission-batch.ts";

const quoteServiceSource = readFileSync(
  new URL("../src/lib/quotes/service.ts", import.meta.url),
  "utf8",
);

function createDatabase(balance = 100) {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE "QuoteRequest" (
      "id" TEXT PRIMARY KEY,
      "status" TEXT NOT NULL
    );
    CREATE TABLE "TradesmanProfile" (
      "userId" TEXT PRIMARY KEY,
      "isVerified" INTEGER NOT NULL
    );
    CREATE TABLE "Notification" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "relatedId" TEXT,
      "relatedType" TEXT
    );
    CREATE TABLE "Wallet" (
      "userId" TEXT PRIMARY KEY,
      "balance" INTEGER NOT NULL,
      "updatedAt" TEXT NOT NULL
    );
    CREATE TABLE "Quote" (
      "id" TEXT PRIMARY KEY,
      "quoteRequestId" TEXT NOT NULL,
      "tradesmanId" TEXT NOT NULL,
      "amount" INTEGER NOT NULL,
      "visitDate" TEXT,
      "message" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      UNIQUE("quoteRequestId", "tradesmanId")
    );
    CREATE TABLE "CreditTransaction" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "quoteRequestId" TEXT,
      "amount" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "memo" TEXT,
      "referenceKey" TEXT UNIQUE
    );
  `);

  database.prepare(`INSERT INTO "QuoteRequest" VALUES ('request-1', 'OPEN')`).run();
  database.prepare(`INSERT INTO "TradesmanProfile" VALUES ('professional-1', 1)`).run();
  database.prepare(
    `INSERT INTO "Notification" VALUES ('notice-1', 'professional-1', 'request-1', 'QUOTE_REQUEST')`,
  ).run();
  database.prepare(
    `INSERT INTO "Wallet" VALUES ('professional-1', ?, '2026-07-12T00:00:00.000Z')`,
  ).run(balance);

  return database;
}

function makeInput(overrides: Partial<QuoteSubmissionBatchInput> = {}) {
  return {
    quoteId: "quote-1",
    transactionId: "transaction-1",
    quoteRequestId: "request-1",
    tradesmanId: "professional-1",
    amount: 2600,
    visitDate: "2026-07-13T09:00:00.000Z",
    message: "I can complete this job.",
    feeAmount: 40,
    feeMemo: "Quote submission fee 40 PHP",
    feeReferenceKey: "quote-fee:professional-1:request-1",
    now: "2026-07-12T00:00:00.000Z",
    ...overrides,
  } satisfies QuoteSubmissionBatchInput;
}

function runAsTransaction(
  database: DatabaseSync,
  input: QuoteSubmissionBatchInput,
  finalSql?: string,
) {
  database.exec("BEGIN IMMEDIATE");

  try {
    for (const statement of buildQuoteSubmissionBatch(input)) {
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

function balance(database: DatabaseSync) {
  return Number(
    (database.prepare(`SELECT "balance" FROM "Wallet"`).get() as { balance: number })
      .balance,
  );
}

test("first quote submission creates the quote and deducts exactly 40 PHP once", () => {
  const database = createDatabase();

  runAsTransaction(database, makeInput());

  assert.equal(count(database, "Quote"), 1);
  assert.equal(count(database, "CreditTransaction"), 1);
  assert.equal(balance(database), 60);
});

test("a concurrent retry with another generated ID does not create or charge twice", () => {
  const database = createDatabase();
  runAsTransaction(database, makeInput());

  runAsTransaction(
    database,
    makeInput({
      quoteId: "quote-retry",
      transactionId: "transaction-retry",
      amount: 2800,
      message: "Updated quote details.",
    }),
  );

  assert.equal(count(database, "Quote"), 1);
  assert.equal(count(database, "CreditTransaction"), 1);
  assert.equal(balance(database), 60);
  assert.deepEqual(
    {
      ...database
        .prepare(`SELECT "amount", "message" FROM "Quote" WHERE "id" = 'quote-1'`)
        .get(),
    },
    { amount: 2600, message: "I can complete this job." },
  );
});

test("editing an already charged quote updates details without another deduction", () => {
  const database = createDatabase();
  runAsTransaction(database, makeInput());

  runAsTransaction(
    database,
    makeInput({
      quoteId: "quote-1",
      transactionId: "transaction-edit",
      amount: 2800,
      message: "Updated quote details.",
    }),
  );

  assert.equal(count(database, "Quote"), 1);
  assert.equal(count(database, "CreditTransaction"), 1);
  assert.equal(balance(database), 60);
  assert.deepEqual(
    {
      ...database
        .prepare(`SELECT "amount", "message" FROM "Quote" WHERE "id" = 'quote-1'`)
        .get(),
    },
    { amount: 2800, message: "Updated quote details." },
  );
});

test("an existing uncharged quote is charged and then safely updated", () => {
  const database = createDatabase();
  database.prepare(
    `INSERT INTO "Quote" VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
  ).run(
    "quote-existing",
    "request-1",
    "professional-1",
    2000,
    null,
    "Old details",
    "2026-07-11T00:00:00.000Z",
  );

  runAsTransaction(
    database,
    makeInput({
      quoteId: "quote-existing",
      amount: 2500,
      message: "Recovered and updated details.",
    }),
  );

  assert.equal(count(database, "CreditTransaction"), 1);
  assert.equal(balance(database), 60);
  assert.equal(
    (database.prepare(`SELECT "amount" FROM "Quote"`).get() as { amount: number }).amount,
    2500,
  );
});

test("insufficient credits leave no quote and no ledger entry", () => {
  const database = createDatabase(39);

  runAsTransaction(database, makeInput());

  assert.equal(count(database, "Quote"), 0);
  assert.equal(count(database, "CreditTransaction"), 0);
  assert.equal(balance(database), 39);
});

test("a failure after the batch statements rolls back quote, ledger, and balance", () => {
  const database = createDatabase();

  assert.throws(() =>
    runAsTransaction(database, makeInput(), `INSERT INTO "MissingTable" VALUES (1)`),
  );

  assert.equal(count(database, "Quote"), 0);
  assert.equal(count(database, "CreditTransaction"), 0);
  assert.equal(balance(database), 100);
});

test("quote submission service uses the atomic D1 batch", () => {
  const start = quoteServiceSource.indexOf("export async function upsertQuoteForTradesman");
  const end = quoteServiceSource.indexOf("export async function selectQuoteForCustomer");
  const source = quoteServiceSource.slice(start, end);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.match(source, /executeAtomicD1Batch\(/);
  assert.match(source, /buildQuoteSubmissionBatch\(/);
  assert.doesNotMatch(source, /prisma\.quote\.delete/);
  assert.doesNotMatch(source, /chargeCreditsForQuoteSubmission/);
});
