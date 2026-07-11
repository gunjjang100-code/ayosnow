import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { createLegalMetadata, getLegalDocument } from "@/lib/legal";

const document = getLegalDocument("privacy");

export const metadata = createLegalMetadata(document);

export default function PrivacyPage() {
  return <LegalDocumentPage document={document} />;
}
