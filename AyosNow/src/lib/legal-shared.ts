export const policyVersions = {
  terms: "2026-06-30",
  privacy: "2026-06-30",
  paymentRefund: "2026-06-30",
  professional: "2026-06-30",
  communityGuidelines: "2026-06-30",
  cookie: "2026-06-30",
} as const;

export const legalPolicySettings = {
  signupConsentVersion: "2026-06-30",
  paymentPolicyVersion: policyVersions.paymentRefund,
  forceReacceptance: false,
} as const;

export const currentPolicyVersion = legalPolicySettings.signupConsentVersion;
export const legalLastUpdated = "June 30, 2026";

export function requiresPaymentPolicyAcceptance(
  acceptedPaymentPolicyVersion: string | null | undefined,
  activePaymentPolicyVersion: string = legalPolicySettings.paymentPolicyVersion,
) {
  return acceptedPaymentPolicyVersion !== activePaymentPolicyVersion;
}

export type LegalSlug =
  | "terms"
  | "privacy"
  | "payment-refund"
  | "pro-policy"
  | "community-guidelines"
  | "cookie-policy";

export const legalLinks: Array<{
  slug: LegalSlug | "contact";
  href: string;
  label: string;
}> = [
  { slug: "terms", href: "/terms", label: "Terms of Service" },
  { slug: "privacy", href: "/privacy", label: "Privacy Policy" },
  { slug: "payment-refund", href: "/payment-refund", label: "Payment & Refund Policy" },
  { slug: "pro-policy", href: "/pro-policy", label: "Professional Policy" },
  { slug: "community-guidelines", href: "/community-guidelines", label: "Community Guidelines" },
  { slug: "cookie-policy", href: "/cookie-policy", label: "Cookie Policy" },
  { slug: "contact", href: "/contact", label: "Contact" },
];
