import { AuthForm } from "@/components/auth/auth-form";
import { getOAuthProviderStatus } from "@/lib/auth/next-auth";
import { getCurrentLocale } from "@/lib/i18n-server";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Login",
  description:
    "Log in to PuntaGo to manage quote requests, bookings, chats, notifications, profiles, and professional credits.",
  path: "/login",
});

export default async function LoginPage() {
  const locale = await getCurrentLocale();
  const providers = getOAuthProviderStatus();

  return (
    <AuthForm
      mode="login"
      googleEnabled={providers.google}
      locale={locale}
    />
  );
}
