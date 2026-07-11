import type { D1AtomicStatement } from "@/lib/d1/atomic-batch";

export interface QuoteSelectionBatchInput {
  quoteId: string;
  quoteRequestId: string;
  customerId: string;
  tradesmanId: string;
  bookingId: string;
  conversationId: string;
  existingConversationId?: string;
  scheduledAt: string;
  amount: number;
  workAddress: string;
  requestTitle: string;
  now: string;
  selectedMessageId: string;
  bookingMessageId: string;
  tradesmanNotificationId: string;
  customerNotificationId: string;
}

const SELECTED_MESSAGE = "The customer selected this quote.";
const BOOKING_MESSAGE = "Booking created.";

export function buildQuoteSelectionBatch(
  input: QuoteSelectionBatchInput,
): D1AtomicStatement[] {
  const bookingGuard = `
    EXISTS (
      SELECT 1
      FROM "QuoteRequest" request
      JOIN "Quote" selectedQuote ON selectedQuote."id" = ?
      JOIN "TradesmanProfile" profile ON profile."userId" = selectedQuote."tradesmanId"
      WHERE request."id" = ?
        AND request."customerId" = ?
        AND request."status" = 'MATCHED'
        AND request."selectedQuoteId" = selectedQuote."id"
        AND selectedQuote."quoteRequestId" = request."id"
        AND selectedQuote."tradesmanId" = ?
        AND selectedQuote."status" = 'ACCEPTED'
        AND profile."isVerified" = 1
    )
  `;

  const statements: D1AtomicStatement[] = [
    {
      name: "claim quote request",
      sql: `
        UPDATE "QuoteRequest"
        SET "selectedQuoteId" = ?, "status" = 'MATCHED', "updatedAt" = ?
        WHERE "id" = ?
          AND "customerId" = ?
          AND "status" = 'OPEN'
          AND ("selectedQuoteId" IS NULL OR "selectedQuoteId" = ?)
          AND EXISTS (
            SELECT 1
            FROM "Quote" candidate
            JOIN "TradesmanProfile" profile ON profile."userId" = candidate."tradesmanId"
            WHERE candidate."id" = ?
              AND candidate."quoteRequestId" = "QuoteRequest"."id"
              AND candidate."tradesmanId" = ?
              AND candidate."status" = 'PENDING'
              AND profile."isVerified" = 1
          )
      `,
      params: [
        input.quoteId,
        input.now,
        input.quoteRequestId,
        input.customerId,
        input.quoteId,
        input.quoteId,
        input.tradesmanId,
      ],
    },
    {
      name: "accept selected quote",
      sql: `
        UPDATE "Quote"
        SET "status" = 'ACCEPTED', "updatedAt" = ?
        WHERE "id" = ?
          AND "quoteRequestId" = ?
          AND "tradesmanId" = ?
          AND "status" IN ('PENDING', 'ACCEPTED')
          AND EXISTS (
            SELECT 1 FROM "QuoteRequest" request
            WHERE request."id" = ?
              AND request."customerId" = ?
              AND request."status" = 'MATCHED'
              AND request."selectedQuoteId" = "Quote"."id"
          )
      `,
      params: [
        input.now,
        input.quoteId,
        input.quoteRequestId,
        input.tradesmanId,
        input.quoteRequestId,
        input.customerId,
      ],
    },
    {
      name: "reject competing quotes",
      sql: `
        UPDATE "Quote"
        SET "status" = 'REJECTED', "updatedAt" = ?
        WHERE "quoteRequestId" = ?
          AND "id" <> ?
          AND "status" = 'PENDING'
          AND EXISTS (
            SELECT 1 FROM "QuoteRequest" request
            WHERE request."id" = ?
              AND request."customerId" = ?
              AND request."status" = 'MATCHED'
              AND request."selectedQuoteId" = ?
          )
      `,
      params: [
        input.now,
        input.quoteRequestId,
        input.quoteId,
        input.quoteRequestId,
        input.customerId,
        input.quoteId,
      ],
    },
    {
      name: "create booking",
      sql: `
        INSERT OR IGNORE INTO "Booking" (
          "id", "customerId", "tradesmanId", "quoteRequestId", "quoteId",
          "scheduledAt", "finalAmount", "workAddress", "status", "updatedAt"
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?
        WHERE ${bookingGuard}
      `,
      params: [
        input.bookingId,
        input.customerId,
        input.tradesmanId,
        input.quoteRequestId,
        input.quoteId,
        input.scheduledAt,
        input.amount,
        input.workAddress,
        input.now,
        input.quoteId,
        input.quoteRequestId,
        input.customerId,
        input.tradesmanId,
      ],
    },
  ];

  if (input.existingConversationId) {
    statements.push({
      name: "attach existing conversation",
      sql: `
        UPDATE "Conversation"
        SET "customerId" = ?,
            "tradesmanId" = ?,
            "bookingId" = (SELECT "id" FROM "Booking" WHERE "quoteId" = ?),
            "quoteId" = ?,
            "requestId" = ?,
            "updatedAt" = ?
        WHERE "id" = ?
          AND EXISTS (SELECT 1 FROM "Booking" WHERE "quoteId" = ?)
      `,
      params: [
        input.customerId,
        input.tradesmanId,
        input.quoteId,
        input.quoteId,
        input.quoteRequestId,
        input.now,
        input.existingConversationId,
        input.quoteId,
      ],
    });
  } else {
    statements.push({
      name: "create conversation",
      sql: `
        INSERT OR IGNORE INTO "Conversation" (
          "id", "customerId", "tradesmanId", "quoteId", "bookingId",
          "requestId", "updatedAt"
        )
        SELECT ?, ?, ?, ?, booking."id", ?, ?
        FROM "Booking" booking
        WHERE booking."quoteId" = ?
      `,
      params: [
        input.conversationId,
        input.customerId,
        input.tradesmanId,
        input.quoteId,
        input.quoteRequestId,
        input.now,
        input.quoteId,
      ],
    });
  }

  statements.push(
    {
      name: "create quote-selected system message",
      sql: `
        INSERT INTO "Message" (
          "id", "conversationId", "senderRole", "messageType", "content"
        )
        SELECT ?, conversation."id", 'SYSTEM', 'SYSTEM', ?
        FROM "Conversation" conversation
        JOIN "Booking" booking ON booking."id" = conversation."bookingId"
        WHERE booking."quoteId" = ?
          AND conversation."quoteId" = ?
          AND NOT EXISTS (
            SELECT 1 FROM "Message" message
            WHERE message."conversationId" = conversation."id"
              AND message."senderRole" = 'SYSTEM'
              AND message."messageType" = 'SYSTEM'
              AND message."content" = ?
          )
      `,
      params: [
        input.selectedMessageId,
        SELECTED_MESSAGE,
        input.quoteId,
        input.quoteId,
        SELECTED_MESSAGE,
      ],
    },
    {
      name: "create booking system message",
      sql: `
        INSERT INTO "Message" (
          "id", "conversationId", "senderRole", "messageType", "content"
        )
        SELECT ?, conversation."id", 'SYSTEM', 'SYSTEM', ?
        FROM "Conversation" conversation
        JOIN "Booking" booking ON booking."id" = conversation."bookingId"
        WHERE booking."quoteId" = ?
          AND conversation."quoteId" = ?
          AND NOT EXISTS (
            SELECT 1 FROM "Message" message
            WHERE message."conversationId" = conversation."id"
              AND message."senderRole" = 'SYSTEM'
              AND message."messageType" = 'SYSTEM'
              AND message."content" = ?
          )
      `,
      params: [
        input.bookingMessageId,
        BOOKING_MESSAGE,
        input.quoteId,
        input.quoteId,
        BOOKING_MESSAGE,
      ],
    },
    {
      name: "notify professional in app",
      sql: `
        INSERT INTO "Notification" (
          "id", "userId", "type", "title", "message", "relatedId", "relatedType", "channel"
        )
        SELECT ?, ?, 'BOOKING_CREATED', 'The customer selected a quote', ?, booking."id", 'BOOKING', 'IN_APP'
        FROM "Booking" booking
        WHERE booking."quoteId" = ?
          AND NOT EXISTS (
            SELECT 1 FROM "Notification" notification
            WHERE notification."userId" = ?
              AND notification."type" = 'BOOKING_CREATED'
              AND notification."relatedId" = booking."id"
              AND notification."channel" = 'IN_APP'
          )
      `,
      params: [
        input.tradesmanNotificationId,
        input.tradesmanId,
        `${input.requestTitle} was converted into a booking.`,
        input.quoteId,
        input.tradesmanId,
      ],
    },
    {
      name: "notify customer in app",
      sql: `
        INSERT INTO "Notification" (
          "id", "userId", "type", "title", "message", "relatedId", "relatedType", "channel"
        )
        SELECT ?, ?, 'BOOKING_CREATED', 'Booking created', ?, booking."id", 'BOOKING', 'IN_APP'
        FROM "Booking" booking
        WHERE booking."quoteId" = ?
          AND NOT EXISTS (
            SELECT 1 FROM "Notification" notification
            WHERE notification."userId" = ?
              AND notification."type" = 'BOOKING_CREATED'
              AND notification."relatedId" = booking."id"
              AND notification."channel" = 'IN_APP'
          )
      `,
      params: [
        input.customerNotificationId,
        input.customerId,
        `${input.requestTitle} was confirmed as a booking.`,
        input.quoteId,
        input.customerId,
      ],
    },
  );

  return statements;
}
