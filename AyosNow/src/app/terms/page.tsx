import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { createLegalMetadata, getLegalDocument } from "@/lib/legal";

const document = getLegalDocument("terms");

export const metadata = createLegalMetadata(document);

export default function TermsPage() {
  return <LegalDocumentPage document={document} />;
}
