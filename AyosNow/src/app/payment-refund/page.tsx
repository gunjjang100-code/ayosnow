import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { createLegalMetadata, getLegalDocument } from "@/lib/legal";

const document = getLegalDocument("payment-refund");

export const metadata = createLegalMetadata(document);

export default function PaymentRefundPage() {
  return <LegalDocumentPage document={document} />;
}
