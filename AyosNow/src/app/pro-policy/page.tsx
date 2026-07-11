import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { createLegalMetadata, getLegalDocument } from "@/lib/legal";

const document = getLegalDocument("pro-policy");

export const metadata = createLegalMetadata(document);

export default function ProPolicyPage() {
  return <LegalDocumentPage document={document} />;
}
