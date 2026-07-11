"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";

import { currentPolicyVersion } from "@/lib/legal-shared";
import type { Category, Locale } from "@/lib/types";

type AuthMode = "login" | "signup";
type SignupRole = "customer" | "tradesman";

type ConsentKey =
  | "acceptedTerms"
  | "acceptedPrivacy"
  | "acceptedPlatformRole"
  | "acceptedProfessionalPolicy"
  | "acceptedMarketing";

interface AuthFormProps {
  mode: AuthMode;
  googleEnabled: boolean;
  locale: Locale;
  initialCategories?: Category[];
}

function getRawErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "fieldErrors" in error) {
    const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    const firstMessage = Object.values(fieldErrors ?? {})
      .flat()
      .find(Boolean);

    if (firstMessage) {
      return firstMessage;
    }
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "";
}

function getErrorMessage(error: unknown, locale: Locale, fallback: string) {
  const rawMessage = getRawErrorMessage(error);

  if (!rawMessage) {
    return fallback;
  }

  if (locale === "fil") {
    if (rawMessage.includes("already registered") || rawMessage.includes("already exists")) {
      return "May account na gamit ang email na ito. Mag-login na lang.";
    }
    if (rawMessage.includes("Referral code was not found")) {
      return "Hindi makita ang referral code. Pakisuri ulit ang code.";
    }
    if (rawMessage.includes("Password")) {
      return "Dapat hindi bababa sa 8 characters ang password.";
    }
    if (rawMessage.includes("email")) {
      return "Maglagay ng valid email address.";
    }
    if (rawMessage.includes("phone number")) {
      return "Isama ang country code sa phone number, gaya ng +639171234567.";
    }
    if (rawMessage.includes("agree") || rawMessage.includes("Policy") || rawMessage.includes("agreement")) {
      return "Kailangan mong tanggapin ang required agreements bago magpatuloy.";
    }

    return fallback;
  }

  if (rawMessage.includes("already registered") || rawMessage.includes("already exists")) {
    return "An account already exists with this email. Please log in.";
  }
  if (rawMessage.includes("Referral code was not found")) {
    return "We could not find that referral code. Please check it again.";
  }
  if (rawMessage.includes("Password")) {
    return "Password must be at least 8 characters.";
  }
  if (rawMessage.includes("email")) {
    return "Please enter a valid email address.";
  }
  if (rawMessage.includes("phone number")) {
    return "Include the country code in the phone number, such as +639171234567.";
  }
  if (rawMessage.includes("agree") || rawMessage.includes("Policy") || rawMessage.includes("agreement")) {
    return "You must accept the required agreements before continuing.";
  }

  return fallback;
}

const authCopy = {
  en: {
    common: {
      requestError: "We could not complete the request. Please try again.",
      signupConsentError: "Please accept all required agreements before creating an account.",
      invalidCredentials: "The email or password is incorrect.",
      googleSignupConsentError: "Please accept the required agreements before signing up with Google.",
      googleNotConfigured: "Google login requires production Google OAuth keys to be connected first.",
      googleSignupConsentHint: "Google sign-up opens Google first. You will choose your role and accept the required agreements after Google confirms your account.",
      professionalCategories: "Professional service categories",
      professionalCategoriesDescription:
        "Choose the services you want to receive quote requests for. You can edit these later in your profile.",
      professionalCategoriesEmpty:
        "No service categories are available yet. Please contact support before creating a professional account.",
      professionalCategoriesRequired: "Choose at least one professional service category.",
      modeHelpLogin: "Sign up creates a new account. Login opens an account you already created.",
      modeHelpSignup: "After sign-up, your customer or professional role controls your screens and permissions.",
      fullName: "Full name",
      role: "Account role",
      customerRole: "Sign up as a customer",
      tradesmanRole: "Sign up as a professional",
      customerRoleGuidance:
        "Customer use is free. Creating requests and receiving or comparing quotations does not use PuntaGo credits.",
      tradesmanRoleGuidance:
        "Admin approval is required before customer work. The first quote for each request deducts 40 PHP in credits; editing the same quote does not deduct again.",
      howItWorksLink: "Read how PuntaGo works",
      phone: "Phone number",
      phoneHelp: "Include the country code for SMS notifications. You may leave this blank.",
      referral: "Referral code",
      referralHelp: "Enter a referral code if you have one. Otherwise, leave it blank.",
      email: "Email",
      password: "Password",
      passwordPlaceholder: "At least 8 characters",
      legalHeading: "Legal agreements",
      legalDescription: `Policy version: ${currentPolicyVersion}. Required items must be accepted before creating an account.`,
      termsPrefix: "I agree to the",
      termsLink: "Terms of Service",
      privacyPrefix: "I agree to the",
      privacyLink: "Privacy Policy",
      platformRole:
        "I understand that PuntaGo is a platform connecting customers with independent service professionals.",
      professionalPrefix: "I agree to the",
      professionalLink: "Professional Policy",
      marketing: "I agree to receive marketing emails, SMS and push notifications.",
      loginAgreementPrefix: "By continuing, you agree to the",
      loginAgreementMiddle: "and",
    },
    login: {
      eyebrow: "Existing account",
      title: "Log in to PuntaGo",
      description:
        "Use the account you already created. If you signed up with Google, use the Google button. If you signed up by email, use your email and password.",
      googleButton: "Continue with Google",
      emailHeading: "Email account login",
      emailDescription: "Enter the email and password you used when you signed up.",
      submit: "Log in with email",
      pending: "Logging in...",
      switchQuestion: "Do not have an account yet?",
      switchLabel: "Create a new account",
      switchHref: "/signup",
    },
    signup: {
      eyebrow: "Create account",
      title: "Create your PuntaGo account",
      description:
        "New to PuntaGo? Create an account here. Google sign-up starts with a basic account, then you choose customer or professional.",
      googleButton: "Create account with Google",
      emailHeading: "Create account by email",
      emailDescription: "With email sign-up, you can choose customer or professional immediately.",
      submit: "Create account",
      pending: "Creating account...",
      switchQuestion: "Already have an account?",
      switchLabel: "Log in",
      switchHref: "/login",
    },
  },
  fil: {
    common: {
      requestError: "Hindi namin makumpleto ang request. Subukan ulit.",
      signupConsentError: "Tanggapin muna ang lahat ng required agreements bago gumawa ng account.",
      invalidCredentials: "Mali ang email o password.",
      googleSignupConsentError: "Tanggapin muna ang required agreements bago mag-sign up gamit ang Google.",
      googleNotConfigured: "Kailangan munang ikonekta ang production Google OAuth keys para magamit ang Google login.",
      googleSignupConsentHint: "Magbubukas muna ang Google sign-up. Pagkatapos makumpirma ng Google ang account mo, pipili ka ng role at tatanggapin ang required agreements.",
      professionalCategories: "Mga service category ng professional",
      professionalCategoriesDescription:
        "Piliin ang services na gusto mong makatanggap ng quote requests. Maaari mo itong baguhin sa profile mo.",
      professionalCategoriesEmpty:
        "Wala pang available na service categories. Makipag-ugnayan muna sa support bago gumawa ng professional account.",
      professionalCategoriesRequired: "Pumili ng kahit isang professional service category.",
      modeHelpLogin: "Ang sign up ay para gumawa ng bagong account. Ang login ay para sa account na nagawa mo na.",
      modeHelpSignup: "Pagkatapos mag-sign up, ang customer o professional role ang magtatakda ng screens at permissions mo.",
      fullName: "Buong pangalan",
      role: "Uri ng account",
      customerRole: "Mag-sign up bilang customer",
      tradesmanRole: "Mag-sign up bilang professional",
      customerRoleGuidance:
        "Libre gamitin bilang customer. Walang PuntaGo credits na kailangan sa paggawa ng request at pagtanggap o pagkumpara ng quotations.",
      tradesmanRoleGuidance:
        "Kailangan muna ng admin approval bago humarap sa customers. Magbabawas ng 40 PHP credits sa unang quote sa bawat request; walang panibagong bawas sa pag-edit ng parehong quote.",
      howItWorksLink: "Basahin kung paano gumagana ang PuntaGo",
      phone: "Phone number",
      phoneHelp: "Isama ang country code para sa SMS notifications. Puwede itong iwanang blank.",
      referral: "Referral code",
      referralHelp: "Ilagay ang referral code kung mayroon ka. Kung wala, iwanang blank.",
      email: "Email",
      password: "Password",
      passwordPlaceholder: "Hindi bababa sa 8 characters",
      legalHeading: "Legal agreements",
      legalDescription: `Policy version: ${currentPolicyVersion}. Kailangan tanggapin ang required items bago gumawa ng account.`,
      termsPrefix: "Sumasang-ayon ako sa",
      termsLink: "Terms of Service",
      privacyPrefix: "Sumasang-ayon ako sa",
      privacyLink: "Privacy Policy",
      platformRole:
        "Nauunawaan ko na ang PuntaGo ay platform na nag-uugnay sa customers at independent service professionals.",
      professionalPrefix: "Sumasang-ayon ako sa",
      professionalLink: "Professional Policy",
      marketing: "Pumapayag akong makatanggap ng marketing emails, SMS at push notifications.",
      loginAgreementPrefix: "Sa pagpapatuloy, sumasang-ayon ka sa",
      loginAgreementMiddle: "at",
    },
    login: {
      eyebrow: "Existing account",
      title: "Mag-login sa PuntaGo",
      description:
        "Gamitin ang account na nagawa mo na. Kung Google ang ginamit mo sa sign-up, gamitin ang Google button. Kung email ang ginamit mo, ilagay ang email at password.",
      googleButton: "Magpatuloy gamit ang Google",
      emailHeading: "Email account login",
      emailDescription: "Ilagay ang email at password na ginamit mo noong sign-up.",
      submit: "Mag-login gamit ang email",
      pending: "Naglo-login...",
      switchQuestion: "Wala ka pang account?",
      switchLabel: "Gumawa ng bagong account",
      switchHref: "/signup",
    },
    signup: {
      eyebrow: "Gumawa ng account",
      title: "Gumawa ng PuntaGo account",
      description:
        "Bago sa PuntaGo? Gumawa ng account dito. Sa Google sign-up, magsisimula ka sa basic account at pipili ng customer o professional pagkatapos.",
      googleButton: "Gumawa ng account gamit ang Google",
      emailHeading: "Gumawa ng account gamit ang email",
      emailDescription: "Sa email sign-up, maaari kang pumili agad bilang customer o professional.",
      submit: "Gumawa ng account",
      pending: "Ginagawa ang account...",
      switchQuestion: "May account ka na?",
      switchLabel: "Mag-login",
      switchHref: "/login",
    },
  },
} as const;

function toSafeInternalPath(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const url = new URL(value);

    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function PolicyLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="font-black text-teal-700 underline decoration-teal-200 underline-offset-4 transition hover:text-teal-900"
    >
      {children}
    </Link>
  );
}

function ConsentCheckbox({
  name,
  checked,
  onChange,
  children,
}: {
  name: ConsentKey;
  checked: boolean;
  onChange: (name: ConsentKey, checked: boolean) => void;
  children: ReactNode;
}) {
  const inputId = `consent-${name}`;

  return (
    <div
      className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 text-slate-700 transition ${
        checked ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-white"
      }`}
    >
      <input
        id={inputId}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(name, event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 accent-teal-700"
      />
      <label htmlFor={inputId} className="flex-1 cursor-pointer">
        {children}
      </label>
    </div>
  );
}

export function AuthForm({
  mode,
  googleEnabled,
  locale,
  initialCategories = [],
}: AuthFormProps) {
  const searchParams = useSearchParams();
  const publicLocale = locale === "fil" ? "fil" : "en";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const initialReferralCode = searchParams.get("ref") ?? "";
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<SignupRole>("customer");
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [consent, setConsent] = useState<Record<ConsentKey, boolean>>({
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedPlatformRole: false,
    acceptedProfessionalPolicy: false,
    acceptedMarketing: false,
  });
  const commonCopy = authCopy[publicLocale].common;
  const pageCopy = authCopy[publicLocale][mode];
  const legalConsentReady =
    mode !== "signup" ||
    (consent.acceptedTerms &&
      consent.acceptedPrivacy &&
      consent.acceptedPlatformRole &&
      (selectedRole !== "tradesman" || consent.acceptedProfessionalPolicy));
  const professionalCategoryReady =
    selectedRole !== "tradesman" || selectedCategorySlugs.length > 0;
  const emailSignupReady = legalConsentReady && professionalCategoryReady;

  function updateConsent(name: ConsentKey, checked: boolean) {
    setConsent((current) => ({
      ...current,
      [name]: checked,
    }));
  }

  function toggleCategory(slug: string) {
    setSelectedCategorySlugs((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "");
    const phoneNumber = String(formData.get("phoneNumber") ?? "");
    const role = String(formData.get("role") ?? "customer") as SignupRole;
    const referralCode = String(formData.get("referralCode") ?? "");

    if (mode === "signup" && !legalConsentReady) {
      setErrorMessage(commonCopy.signupConsentError);
      return;
    }

    if (mode === "signup" && role === "tradesman" && selectedCategorySlugs.length === 0) {
      setErrorMessage(commonCopy.professionalCategoriesRequired);
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "signup") {
          const response = await fetch("/api/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullName,
              phoneNumber,
              email,
              password,
              role,
              referralCode,
              categorySlugs: role === "tradesman" ? selectedCategorySlugs : [],
              consent: {
                acceptedTerms: consent.acceptedTerms,
                acceptedPrivacy: consent.acceptedPrivacy,
                acceptedPaymentPolicy: false,
                acceptedPlatformRole: consent.acceptedPlatformRole,
                acceptedProfessionalPolicy:
                  role === "tradesman" ? consent.acceptedProfessionalPolicy : false,
                acceptedMarketing: consent.acceptedMarketing,
              },
            }),
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: unknown }
            | null;

          if (!response.ok) {
            throw new Error(getErrorMessage(payload?.error, locale, commonCopy.requestError));
          }
        }

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          throw new Error(commonCopy.invalidCredentials);
        }

        const fallbackUrl = mode === "signup" && role === "tradesman" ? "/dashboard" : callbackUrl;
        const nextUrl = toSafeInternalPath(result?.url, fallbackUrl);

        window.location.assign(nextUrl);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, locale, commonCopy.requestError));
      }
    });
  }

  function handleOAuth(provider: "google") {
    void signIn(provider, { callbackUrl });
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="glass-card p-8">
        <span className="eyebrow-pill">{pageCopy.eyebrow}</span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          {pageCopy.title}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {pageCopy.description}
        </p>

        <div className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Google
          </p>
          <button
            type="button"
            disabled={!googleEnabled}
            onClick={() => handleOAuth("google")}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.55)] transition duration-150 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-950 active:translate-y-0 active:scale-[0.98] active:border-teal-500 active:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:bg-white"
          >
            {pageCopy.googleButton}
          </button>
          {!googleEnabled ? (
            <p className="text-xs leading-5 text-amber-700">
              {commonCopy.googleNotConfigured}
            </p>
          ) : null}
          {mode === "signup" ? (
            <p className="text-xs leading-5 text-slate-500">
              {commonCopy.googleSignupConsentHint}
            </p>
          ) : null}
        </div>

        <div className="mt-5 rounded-3xl bg-slate-950 p-4 text-sm leading-6 text-white">
          {mode === "login" ? commonCopy.modeHelpLogin : commonCopy.modeHelpSignup}
        </div>
      </section>

      <section className="panel-shell p-8">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
            {mode === "signup" ? "Sign up" : "Sign in"}
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{pageCopy.emailHeading}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{pageCopy.emailDescription}</p>
        </div>

        <form className="grid gap-4" onSubmit={handleEmailSubmit}>
          {mode === "signup" ? (
            <>
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                {commonCopy.fullName}
                <input
                  name="fullName"
                  required
                  minLength={2}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
                  placeholder="Maria Cruz"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                {commonCopy.role}
                <select
                  name="role"
                  value={selectedRole}
                  onChange={(event) => {
                    setSelectedRole(event.target.value as SignupRole);
                    setErrorMessage(null);
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
                >
                  <option value="customer">{commonCopy.customerRole}</option>
                  <option value="tradesman">{commonCopy.tradesmanRole}</option>
                </select>
              </label>
              <div className="rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-xs font-semibold leading-5 text-teal-950">
                <p>
                  {selectedRole === "tradesman"
                    ? commonCopy.tradesmanRoleGuidance
                    : commonCopy.customerRoleGuidance}
                </p>
                <Link
                  href="/how-it-works"
                  target="_blank"
                  className="mt-2 inline-flex font-black text-teal-700 underline decoration-teal-200 underline-offset-4"
                >
                  {commonCopy.howItWorksLink}
                </Link>
              </div>
              {selectedRole === "tradesman" ? (
                <section className="grid gap-3 rounded-3xl border border-teal-100 bg-teal-50/45 p-4">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {commonCopy.professionalCategories}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {commonCopy.professionalCategoriesDescription}
                    </p>
                  </div>
                  {initialCategories.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {initialCategories.map((category) => {
                        const checked = selectedCategorySlugs.includes(category.slug);

                        return (
                          <button
                            key={category.slug}
                            type="button"
                            aria-pressed={checked}
                            onClick={() => toggleCategory(category.slug)}
                            className={`rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
                              checked
                                ? "border-teal-300 bg-white text-teal-900 shadow-[0_14px_28px_-24px_rgba(15,118,110,0.8)]"
                                : "border-white bg-white/70 text-slate-700 hover:border-teal-200 hover:bg-white"
                            }`}
                          >
                            <span className="block text-sm font-black">{category.name}</span>
                            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                              {category.shortDescription}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-2xl bg-white px-4 py-3 text-xs font-semibold leading-5 text-amber-700">
                      {commonCopy.professionalCategoriesEmpty}
                    </p>
                  )}
                </section>
              ) : null}
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                {commonCopy.phone}
                <input
                  name="phoneNumber"
                  type="tel"
                  inputMode="tel"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
                  placeholder="+639171234567"
                />
                <span className="text-xs font-medium leading-5 text-slate-500">
                  {commonCopy.phoneHelp}
                </span>
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                {commonCopy.referral}
                <input
                  name="referralCode"
                  defaultValue={initialReferralCode}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
                  placeholder="PUNTA-AB12CD34"
                />
                <span className="text-xs font-medium leading-5 text-slate-500">
                  {commonCopy.referralHelp}
                </span>
              </label>
            </>
          ) : null}

          <label className="grid gap-2 text-sm font-bold text-slate-800">
            {commonCopy.email}
            <input
              name="email"
              required
              type="email"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-800">
            {commonCopy.password}
            <input
              name="password"
              required
              type="password"
              minLength={8}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
              placeholder={commonCopy.passwordPlaceholder}
            />
          </label>

          {mode === "signup" ? (
            <section className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-black text-slate-950">{commonCopy.legalHeading}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {commonCopy.legalDescription}
                </p>
              </div>

              <ConsentCheckbox
                name="acceptedTerms"
                checked={consent.acceptedTerms}
                onChange={updateConsent}
              >
                {commonCopy.termsPrefix}{" "}
                <PolicyLink href="/terms">{commonCopy.termsLink}</PolicyLink>.
              </ConsentCheckbox>
              <ConsentCheckbox
                name="acceptedPrivacy"
                checked={consent.acceptedPrivacy}
                onChange={updateConsent}
              >
                {commonCopy.privacyPrefix}{" "}
                <PolicyLink href="/privacy">{commonCopy.privacyLink}</PolicyLink>.
              </ConsentCheckbox>
              <ConsentCheckbox
                name="acceptedPlatformRole"
                checked={consent.acceptedPlatformRole}
                onChange={updateConsent}
              >
                {commonCopy.platformRole}
              </ConsentCheckbox>
              {selectedRole === "tradesman" ? (
                <ConsentCheckbox
                  name="acceptedProfessionalPolicy"
                  checked={consent.acceptedProfessionalPolicy}
                  onChange={updateConsent}
                >
                  {commonCopy.professionalPrefix}{" "}
                  <PolicyLink href="/pro-policy">{commonCopy.professionalLink}</PolicyLink>.
                </ConsentCheckbox>
              ) : null}
              <ConsentCheckbox
                name="acceptedMarketing"
                checked={consent.acceptedMarketing}
                onChange={updateConsent}
              >
                {commonCopy.marketing}
              </ConsentCheckbox>
            </section>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {commonCopy.loginAgreementPrefix}{" "}
              <PolicyLink href="/terms">{commonCopy.termsLink}</PolicyLink>{" "}
              {commonCopy.loginAgreementMiddle}{" "}
              <PolicyLink href="/privacy">{commonCopy.privacyLink}</PolicyLink>.
            </p>
          )}

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending || (mode === "signup" && !emailSignupReady)}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold !text-white shadow-[0_18px_32px_-22px_rgba(15,23,42,0.85)] transition duration-150 hover:-translate-y-0.5 hover:bg-teal-700 active:translate-y-0 active:scale-[0.98] active:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-slate-950"
          >
            {isPending ? pageCopy.pending : pageCopy.submit}
          </button>
        </form>

        <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {pageCopy.switchQuestion}{" "}
          <Link
            href={pageCopy.switchHref}
            className="font-bold text-teal-700"
          >
            {pageCopy.switchLabel}
          </Link>
        </p>
      </section>
    </div>
  );
}
