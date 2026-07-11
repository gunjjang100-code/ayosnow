"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { legalPolicySettings } from "@/lib/legal-shared";
import type { Locale } from "@/lib/types";

const TOPUP_OPTIONS = [200, 400, 800] as const;

type WalletTopupHistoryItem = {
  id: string;
  amount: number;
  status: string;
  createdAtLabel: string;
};

interface TradesmanWalletTopupPanelProps {
  initialBalance: string;
  requiresPaymentPolicyAcceptance: boolean;
  paymentPolicyVersion?: string;
  historyItems?: WalletTopupHistoryItem[];
  locale: Locale;
}

function getStatusLabel(status: string, locale: Locale) {
  const fil = locale === "fil";
  switch (status) {
    case "PAID":
      return fil ? "Tapos na ang top-up" : "Top-up complete";
    case "PENDING":
      return fil ? "Naghihintay ang top-up" : "Top-up pending";
    case "FAILED":
      return fil ? "Hindi nagtagumpay" : "Top-up failed";
    case "REFUNDED":
      return fil ? "Na-refund" : "Refunded";
    case "EXPIRED":
      return fil ? "Nag-expire" : "Expired";
    default:
      return status;
  }
}

export function TradesmanWalletTopupPanel({
  initialBalance,
  requiresPaymentPolicyAcceptance,
  paymentPolicyVersion = legalPolicySettings.paymentPolicyVersion,
  historyItems = [],
  locale,
}: TradesmanWalletTopupPanelProps) {
  const fil = locale === "fil";
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [acceptedPaymentPolicy, setAcceptedPaymentPolicy] = useState(
    !requiresPaymentPolicyAcceptance,
  );

  const balanceLabel = useMemo(() => {
    const numericBalance = Number(initialBalance);

    if (Number.isFinite(numericBalance)) {
      return numericBalance.toLocaleString("en-US");
    }

    return initialBalance;
  }, [initialBalance]);

  function handleTopup(amount: number) {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (requiresPaymentPolicyAcceptance && !acceptedPaymentPolicy) {
      setErrorMessage(fil ? "Tanggapin muna ang Payment & Refund Policy bago mag-top up." : "Please accept the Payment & Refund Policy before topping up.");
      return;
    }

    const accepted = window.confirm(fil ? `Mag-top up ng ${amount} PHP credits?` : `Top up ${amount} PHP credits?`);

    if (!accepted) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/wallet-topups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          acceptedPaymentPolicy: requiresPaymentPolicyAcceptance
            ? acceptedPaymentPolicy
            : false,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            checkoutUrl?: string | null;
            error?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | string;
          }
        | null;

      if (!response.ok) {
        if (typeof result?.error === "string") {
          setErrorMessage(result.error);
          return;
        }

        const firstFieldError = result?.error?.fieldErrors
          ? Object.values(result.error.fieldErrors).flat().find(Boolean)
          : null;

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? (fil ? "Hindi mabuksan ang top-up checkout." : "Could not open the top-up checkout."));
        return;
      }

      if (!result?.checkoutUrl) {
        setErrorMessage(fil ? "Hindi nakuha ang checkout link. Subukan ulit." : "Could not receive the checkout URL. Please try again.");
        return;
      }

      setSuccessMessage(fil ? "Dadalhin ka sa checkout." : "Redirecting to checkout.");
      window.location.href = result.checkoutUrl;
    });
  }

  return (
    <article className="panel-shell p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{fil ? "Professional Credit Top-up" : "Professional Credit Top-up"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {fil ? "Kailangan ang credits para magpadala ng quotes. Idaragdag sa balance ang completed top-ups." : "Credits are required to send quotes. Completed top-ups are added to your balance."}
          </p>
        </div>
        <span className="chip">GCash / Maya / Card</span>
      </div>

      <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3">
        <p className="text-sm font-medium text-teal-900">{fil ? "Kasalukuyang credits" : "Current credits"}</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{balanceLabel} PHP</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          {fil ? "Magbabawas ng 40 PHP sa unang quote para sa bawat request." : "Each first quote submission deducts 40 PHP from this balance."}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-600">
        {fil ? "Paraan ng pagbabayad" : "Payment methods"}: <span className="font-semibold text-slate-900">GCash / Maya / Card</span>
      </div>

      {requiresPaymentPolicyAcceptance ? (
        <label
          className={`mt-4 flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 transition ${
            acceptedPaymentPolicy
              ? "border-teal-200 bg-teal-50 text-teal-950"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          <input
            type="checkbox"
            checked={acceptedPaymentPolicy}
            onChange={(event) => setAcceptedPaymentPolicy(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 accent-teal-700"
          />
          <span>
            {fil ? "Bago magbayad, sumasang-ayon ako sa" : "Before payment, I agree to the"}{" "}
            <Link
              href="/payment-refund"
              target="_blank"
              rel="noreferrer"
              className="font-black text-teal-700 underline decoration-teal-200 underline-offset-4"
            >
              Payment & Refund Policy
            </Link>
            . {fil ? "Bersyon" : "Version"}: {paymentPolicyVersion}
          </span>
        </label>
      ) : (
        <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm leading-6 text-teal-900">
          {fil ? `Tinanggap mo na ang Payment & Refund Policy version ${paymentPolicyVersion}.` : `You have already accepted Payment & Refund Policy version ${paymentPolicyVersion}.`}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {TOPUP_OPTIONS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handleTopup(amount)}
            disabled={
              isPending ||
              (requiresPaymentPolicyAcceptance && !acceptedPaymentPolicy)
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-sm font-medium text-slate-500">{fil ? "Top-up package" : "Top-up package"}</p>
            <p className="mt-2 text-xl font-bold text-slate-950">+{amount} PHP</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {fil ? "Pindutin para magpatuloy sa checkout." : "Click to continue to checkout."}
            </p>
          </button>
        ))}
      </div>

      {historyItems.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-bold text-slate-950">{fil ? "Mga recent top-up" : "Recent top-ups"}</p>
          <div className="mt-3 grid gap-3">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-950">+{item.amount} PHP</p>
                  <p className="mt-1 text-xs text-slate-500">{item.createdAtLabel}</p>
                </div>
                <span className="chip">{getStatusLabel(item.status, locale)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {errorMessage ? <p className="mt-4 text-sm font-medium text-rose-600">{errorMessage}</p> : null}
      {successMessage ? (
        <p className="mt-4 text-sm font-medium text-emerald-700">{successMessage}</p>
      ) : null}

      <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm leading-6 text-teal-900">
        {fil ? "Awtomatikong chine-check ang payment status. Makikita ang resulta sa top-up history." : "Payment status is checked automatically. You can confirm completion in your top-up history."}
      </div>
    </article>
  );
}
