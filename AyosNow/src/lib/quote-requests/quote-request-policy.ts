import { QuoteRequestStatus } from "@prisma/client";

export function canCustomerChangeQuoteRequest(status: QuoteRequestStatus) {
  return status === QuoteRequestStatus.OPEN;
}
