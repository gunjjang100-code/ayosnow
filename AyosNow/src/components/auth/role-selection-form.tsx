"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";

import { currentPolicyVersion } from "@/lib/legal-shared";
import type { Locale, UserRole } from "@/lib/types";

type SelectableRole = Exclude<UserRole, "admin">;
type ConsentKey =
  | "acceptedTerms"
  | "acceptedPrivacy"
  | "acceptedPlatformRole"
  | "acceptedProfessionalPolicy"
  | "acceptedMarketing";

const roleSelectionCopy = {
  en: {
    requiredConsentError: "Please accept all required agreements before saving your role.",
    saveError: "We could not save your role. Please try again.",
    customerBadge: "Customer",
    customerTitle: "I need services",
    customerDescription: "Find, compare, and book home services such as cleaning, repairs, and moving.",
    customerGuidance:
      "Free for customers. Requests and quotation comparison do not use PuntaGo credits.",
    tradesmanBadge: "Professional",
    tradesmanTitle: "I provide services",
    tradesmanDescription: "Send quotes, manage your services, and control your available schedule.",
    tradesmanGuidance:
      "Admin approval is required. The first quote for each request deducts 40 PHP in credits; editing it does not deduct again.",
    legalHeading: "Legal agreements",
    legalDescription: `Policy version: ${currentPolicyVersion}. Google sign-up is completed after accepting the required agreements.`,
    termsPrefix: "I agree to the",
    termsLink: "Terms of Service",
    privacyPrefix: "I agree to the",
    privacyLink: "Privacy Policy",
    platformRole:
      "I understand that PuntaGo is a platform connecting customers with independent service professionals.",
    professionalPrefix: "I agree to the",
    professionalLink: "Professional Policy",
    marketing: "I agree to receive marketing emails, SMS and push notifications.",
    pending: "Saving...",
    submit: "Finish selection",
  },
  fil: {
    requiredConsentError: "Tanggapin muna ang lahat ng required agreements bago i-save ang role mo.",
    saveError: "Hindi namin ma-save ang role mo. Subukan ulit.",
    customerBadge: "Customer",
    customerTitle: "Kailangan ko ng services",
    customerDescription: "Maghanap, magkumpara, at mag-book ng home services gaya ng cleaning, repairs, at moving.",
    customerGuidance:
      "Libre para sa customers. Walang PuntaGo credits na kailangan sa requests at quotation comparison.",
    tradesmanBadge: "Professional",
    tradesmanTitle: "Nagbibigay ako ng services",
    tradesmanDescription: "Magpadala ng quotes, i-manage ang services, at ayusin ang available schedule mo.",
    tradesmanGuidance:
      "Kailangan muna ng admin approval. Magbabawas ng 40 PHP credits sa unang quote sa bawat request; walang panibagong bawas sa pag-edit nito.",
    legalHeading: "Legal agreements",
    legalDescription: `Policy version: ${currentPolicyVersion}. Matatapos ang Google sign-up pagkatapos tanggapin ang required agreements.`,
    termsPrefix: "Sumasang-ayon ako sa",
    termsLink: "Terms of Service",
    privacyPrefix: "Sumasang-ayon ako sa",
    privacyLink: "Privacy Policy",
    platformRole:
      "Nauunawaan ko na ang PuntaGo ay platform na nag-uugnay sa customers at independent service professionals.",
    professionalPrefix: "Sumasang-ayon ako sa",
    professionalLink: "Professional Policy",
    marketing: "Pumapayag akong makatanggap ng marketing emails, SMS at push notifications.",
    pending: "Sine-save...",
    submit: "Tapusin ang pagpili",
  },
} as const;

function getSafeCallbackUrl(value: string | null, selectedRole: SelectableRole) {
  const fallback = selectedRole === "tradesman" ? "/dashboard" : "/";

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value === "/choose-role") {
    return fallback;
  }

  return value;
}

export function RoleSelectionForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const publicLocale = locale === "fil" ? "fil" : "en";
  const text = roleSelectionCopy[publicLocale];
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<SelectableRole>("customer");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [consent, setConsent] = useState<Record<ConsentKey, boolean>>({
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedPlatformRole: false,
    acceptedProfessionalPolicy: false,
    acceptedMarketing: false,
  });
  const requiredConsentReady =
    consent.acceptedTerms &&
    consent.acceptedPrivacy &&
    consent.acceptedPlatformRole &&
    (selectedRole !== "tradesman" || consent.acceptedProfessionalPolicy);

  function updateConsent(name: ConsentKey, checked: boolean) {
    setConsent((current) => ({
      ...current,
      [name]: checked,
    }));
  }

  function submitRole() {
    setErrorMessage(null);

    if (!requiredConsentReady) {
      setErrorMessage(text.requiredConsentError);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/account/role", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: selectedRole,
            consent: {
              acceptedTerms: consent.acceptedTerms,
              acceptedPrivacy: consent.acceptedPrivacy,
              acceptedPaymentPolicy: false,
              acceptedPlatformRole: consent.acceptedPlatformRole,
              acceptedProfessionalPolicy:
                selectedRole === "tradesman" ? consent.acceptedProfessionalPolicy : false,
              acceptedMarketing: consent.acceptedMarketing,
            },
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: unknown }
          | null;

        if (!response.ok) {
          const message =
            typeof payload?.error === "string"
              ? payload.error
              : text.saveError;
          throw new Error(message);
        }

        const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"), selectedRole);
        router.push(callbackUrl);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : text.saveError);
      }
    });
  }

  return (
    <section className="panel-shell p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setSelectedRole("customer")}
          className={`rounded-[2rem] border p-5 text-left transition ${
            selectedRole === "customer"
              ? "border-teal-300 bg-teal-50 shadow-[0_18px_34px_-26px_rgba(15,118,110,0.6)]"
              : "border-slate-200 bg-white hover:border-teal-200"
          }`}
        >
          <span className="eyebrow-pill">{text.customerBadge}</span>
          <h2 className="mt-4 text-2xl font-black text-slate-950">{text.customerTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {text.customerDescription}
          </p>
          <p className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs font-bold leading-5 text-teal-900">
            {text.customerGuidance}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole("tradesman")}
          className={`rounded-[2rem] border p-5 text-left transition ${
            selectedRole === "tradesman"
              ? "border-teal-300 bg-teal-50 shadow-[0_18px_34px_-26px_rgba(15,118,110,0.6)]"
              : "border-slate-200 bg-white hover:border-teal-200"
          }`}
        >
          <span className="eyebrow-pill">{text.tradesmanBadge}</span>
          <h2 className="mt-4 text-2xl font-black text-slate-950">{text.tradesmanTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {text.tradesmanDescription}
          </p>
          <p className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs font-bold leading-5 text-teal-900">
            {text.tradesmanGuidance}
          </p>
        </button>
      </div>

      <div className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-black text-slate-950">{text.legalHeading}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {text.legalDescription}
          </p>
        </div>
        <ConsentCheckbox
          name="acceptedTerms"
          checked={consent.acceptedTerms}
          onChange={updateConsent}
        >
          {text.termsPrefix} <PolicyLink href="/terms">{text.termsLink}</PolicyLink>.
        </ConsentCheckbox>
        <ConsentCheckbox
          name="acceptedPrivacy"
          checked={consent.acceptedPrivacy}
          onChange={updateConsent}
        >
          {text.privacyPrefix} <PolicyLink href="/privacy">{text.privacyLink}</PolicyLink>.
        </ConsentCheckbox>
        <ConsentCheckbox
          name="acceptedPlatformRole"
          checked={consent.acceptedPlatformRole}
          onChange={updateConsent}
        >
          {text.platformRole}
        </ConsentCheckbox>
        {selectedRole === "tradesman" ? (
          <ConsentCheckbox
            name="acceptedProfessionalPolicy"
            checked={consent.acceptedProfessionalPolicy}
            onChange={updateConsent}
          >
            {text.professionalPrefix}{" "}
            <PolicyLink href="/pro-policy">{text.professionalLink}</PolicyLink>.
          </ConsentCheckbox>
        ) : null}
        <ConsentCheckbox
          name="acceptedMarketing"
          checked={consent.acceptedMarketing}
          onChange={updateConsent}
        >
          {text.marketing}
        </ConsentCheckbox>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={submitRole}
        disabled={isPending || !requiredConsentReady}
        className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? text.pending : text.submit}
      </button>
    </section>
  );
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
  const inputId = `role-consent-${name}`;

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
