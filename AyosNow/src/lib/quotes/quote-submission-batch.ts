import type { D1AtomicStatement } from "@/lib/d1/atomic-batch";

export interface QuoteSubmissionBatchInput {
  quoteId: string;
  transactionId: string;
  quoteRequestId: string;
  tradesmanId: string;
  amount: number;
  visitDate: string | null;
  message: string;
  feeAmount: number;
  feeMemo: string;
  feeReferenceKey: string;
  now: string;
}

/**
 * 견적, 40 PHP 원장, 지갑 차감을 하나의 D1 트랜잭션으로 묶는다.
 * 같은 요청이 재전송되면 고유 referenceKey가 이미 있으므로 다시 차감하지 않는다.
 */
export function buildQuoteSubmissionBatch(
  input: QuoteSubmissionBatchInput,
): D1AtomicStatement[] {
  const requestGuard = `
    EXISTS (
      SELECT 1
      FROM "QuoteRequest" request
      JOIN "TradesmanProfile" profile ON profile."userId" = ?
      WHERE request."id" = ?
        AND request."status" = 'OPEN'
        AND profile."isVerified" = 1
        AND EXISTS (
          SELECT 1
          FROM "Notification" notification
          WHERE notification."userId" = ?
            AND notification."relatedId" = request."id"
            AND notification."relatedType" = 'QUOTE_REQUEST'
        )
    )
  `;

  return [
    {
      name: "create quote when credit is available",
      sql: `
        INSERT OR IGNORE INTO "Quote" (
          "id", "quoteRequestId", "tradesmanId", "amount", "visitDate",
          "message", "status", "updatedAt"
        )
        SELECT ?, ?, ?, ?, ?, ?, 'PENDING', ?
        WHERE ${requestGuard}
          AND EXISTS (
            SELECT 1 FROM "Wallet" wallet
            WHERE wallet."userId" = ? AND wallet."balance" >= ?
          )
          AND NOT EXISTS (
            SELECT 1 FROM "CreditTransaction" ledger
            WHERE ledger."referenceKey" = ?
          )
      `,
      params: [
        input.quoteId,
        input.quoteRequestId,
        input.tradesmanId,
        input.amount,
        input.visitDate,
        input.message,
        input.now,
        input.tradesmanId,
        input.quoteRequestId,
        input.tradesmanId,
        input.tradesmanId,
        input.feeAmount,
        input.feeReferenceKey,
      ],
    },
    {
      name: "record quote submission fee",
      sql: `
        INSERT OR IGNORE INTO "CreditTransaction" (
          "id", "userId", "quoteRequestId", "amount", "type", "memo", "referenceKey"
        )
        SELECT ?, ?, ?, ?, 'CHARGE', ?, ?
        WHERE ${requestGuard}
          AND EXISTS (
            SELECT 1 FROM "Quote" quote
            WHERE quote."id" = ?
              AND quote."quoteRequestId" = ?
              AND quote."tradesmanId" = ?
          )
          AND EXISTS (
            SELECT 1 FROM "Wallet" wallet
            WHERE wallet."userId" = ? AND wallet."balance" >= ?
          )
          AND NOT EXISTS (
            SELECT 1 FROM "CreditTransaction" ledger
            WHERE ledger."referenceKey" = ?
          )
      `,
      params: [
        input.transactionId,
        input.tradesmanId,
        input.quoteRequestId,
        input.feeAmount,
        input.feeMemo,
        input.feeReferenceKey,
        input.tradesmanId,
        input.quoteRequestId,
        input.tradesmanId,
        input.quoteId,
        input.quoteRequestId,
        input.tradesmanId,
        input.tradesmanId,
        input.feeAmount,
        input.feeReferenceKey,
      ],
    },
    {
      name: "deduct quote submission fee",
      sql: `
        UPDATE "Wallet"
        SET "balance" = "balance" - ?, "updatedAt" = ?
        WHERE "userId" = ?
          AND "balance" >= ?
          AND EXISTS (
            SELECT 1 FROM "CreditTransaction" ledger
            WHERE ledger."id" = ?
              AND ledger."referenceKey" = ?
              AND ledger."userId" = "Wallet"."userId"
          )
      `,
      params: [
        input.feeAmount,
        input.now,
        input.tradesmanId,
        input.feeAmount,
        input.transactionId,
        input.feeReferenceKey,
      ],
    },
    {
      name: "save quote details after fee is secured",
      sql: `
        UPDATE "Quote"
        SET "amount" = ?,
            "visitDate" = ?,
            "message" = ?,
            "status" = 'PENDING',
            "updatedAt" = ?
        WHERE "id" = ?
          AND "quoteRequestId" = ?
          AND "tradesmanId" = ?
          AND ${requestGuard}
          AND EXISTS (
            SELECT 1 FROM "CreditTransaction" ledger
            WHERE ledger."referenceKey" = ?
              AND ledger."userId" = "Quote"."tradesmanId"
              AND ledger."quoteRequestId" = "Quote"."quoteRequestId"
          )
      `,
      params: [
        input.amount,
        input.visitDate,
        input.message,
        input.now,
        input.quoteId,
        input.quoteRequestId,
        input.tradesmanId,
        input.tradesmanId,
        input.quoteRequestId,
        input.tradesmanId,
        input.feeReferenceKey,
      ],
    },
  ];
}
