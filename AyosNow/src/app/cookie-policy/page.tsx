import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { createLegalMetadata, getLegalDocument } from "@/lib/legal";

const document = getLegalDocument("cookie-policy");

export const metadata = createLegalMetadata(document);

export default function CookiePolicyPage() {
  return <LegalDocumentPage document={document} />;
}
