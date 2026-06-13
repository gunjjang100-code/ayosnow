import { AuthForm } from "@/components/auth/auth-form";
import { getOAuthProviderStatus } from "@/lib/auth/next-auth";

export default function SignUpPage() {
  const providers = getOAuthProviderStatus();

  return (
    <AuthForm
      mode="signup"
      googleEnabled={providers.google}
    />
  );
}
