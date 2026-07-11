import { AuthForm } from "@/components/auth/auth-form";
import { getOAuthProviderStatus } from "@/lib/auth/next-auth";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listMarketplaceCategories } from "@/lib/marketplace/catalog-service";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Create a Customer or Professional Account",
  description:
    "Create a PuntaGo account as a customer or professional. Professionals can choose service categories and receive matching quote requests.",
  path: "/signup",
});

export default async function SignUpPage() {
  const locale = await getCurrentLocale();
  const providers = getOAuthProviderStatus();
  const categories = await listMarketplaceCategories(locale);

  return (
    <AuthForm
      mode="signup"
      googleEnabled={providers.google}
      locale={locale}
      initialCategories={categories}
    />
  );
}
