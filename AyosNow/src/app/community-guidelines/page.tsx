import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { createLegalMetadata, getLegalDocument } from "@/lib/legal";

const document = getLegalDocument("community-guidelines");

export const metadata = createLegalMetadata(document);

export default function CommunityGuidelinesPage() {
  return <LegalDocumentPage document={document} />;
}
