import { AuthForm } from "@/components/auth/auth-form";
import { getOAuthProviderStatus } from "@/lib/auth/next-auth";

export default function LoginPage() {
  const providers = getOAuthProviderStatus();

  return (
    <AuthForm
      mode="login"
      googleEnabled={providers.google}
      facebookEnabled={providers.facebook}
    />
  );
}
