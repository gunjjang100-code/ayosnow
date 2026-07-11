"use client";

import { useMemo, useState, type FormEvent } from "react";

import type { Locale } from "@/lib/types";

interface AccountDeletionPanelProps {
  locale: Locale;
  pendingRequest: {
    id: string;
    reason: string | null;
    requestedAt: string;
  } | null;
}

const labels = {
  en: {
    title: "Account deletion",
    description:
      "Request account deletion if you no longer want to use PuntaGo. An admin will review the request before the account is closed.",
    pendingTitle: "Deletion request received",
    pendingDescription:
      "Your account deletion request is pending admin review. You can keep using your account until it is completed.",
    reason: "Reason",
    reasonPlaceholder: "Optional: tell us why you want to delete this account.",
    confirm: "Type DELETE to confirm",
    action: "Request account deletion",
    saving: "Submitting...",
    success: "Your account deletion request was submitted.",
    error: "Could not submit the account deletion request.",
    caution:
      "After admin completion, sign-in is disabled and some records may be retained when required for bookings, safety, legal, or payment records.",
  },
  fil: {
    title: "Account deletion",
    description:
      "Mag-request ng account deletion kung hindi mo na gustong gamitin ang PuntaGo. Ire-review muna ito ng admin bago isara ang account.",
    pendingTitle: "Natanggap ang deletion request",
    pendingDescription:
      "Nasa admin review na ang account deletion request mo. Magagamit mo pa ang account hanggang makumpleto ito.",
    reason: "Reason",
    reasonPlaceholder: "Optional: ilagay kung bakit mo gustong i-delete ang account.",
    confirm: "I-type ang DELETE para kumpirmahin",
    action: "Request account deletion",
    saving: "Ipinapasa...",
    success: "Na-submit na ang account deletion request mo.",
    error: "Hindi ma-submit ang account deletion request.",
    caution:
      "Kapag nakumpleto ng admin, hindi ka na makakapag-sign in. May ilang record na maaaring manatili para sa bookings, safety, legal, o payment records.",
  },
} as const;

export function AccountDeletionPanel({ locale, pendingRequest }: AccountDeletionPanelProps) {
  const text = labels[locale];
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = confirmText.trim() === "DELETE" && !isSubmitting;

  const requestedAtLabel = useMemo(() => {
    if (!pendingRequest) return null;
    return new Intl.DateTimeFormat(locale === "fil" ? "fil-PH" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(pendingRequest.requestedAt));
  }, [locale, pendingRequest]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/account/deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          confirmText: confirmText.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? text.error);
      }

      setNotice(text.success);
      setReason("");
      setConfirmText("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : text.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="soft-card border-red-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-slate-950">{text.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{text.description}</p>
        </div>
        <span className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-700">
          {pendingRequest ? "Pending" : "Sensitive"}
        </span>
      </div>

      {pendingRequest ? (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-950">{text.pendingTitle}</p>
          <p className="mt-2 text-sm leading-6 text-amber-900">{text.pendingDescription}</p>
          {requestedAtLabel ? (
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
              {requestedAtLabel}
            </p>
          ) : null}
        </div>
      ) : (
        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            <span>{text.reason}</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={4}
              className="min-h-28 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              placeholder={text.reasonPlaceholder}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-800">
            <span>{text.confirm}</span>
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              className="min-h-12 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
              placeholder="DELETE"
            />
          </label>

          <p className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
            {text.caution}
          </p>

          {notice ? (
            <p className="rounded-2xl bg-teal-50 p-4 text-sm font-semibold text-teal-800">{notice}</p>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-red-700 px-5 py-3 text-sm font-black !text-white shadow-[0_18px_30px_-22px_rgba(185,28,28,0.85)] transition hover:bg-red-800 hover:!text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:!text-slate-500"
          >
            {isSubmitting ? text.saving : text.action}
          </button>
        </form>
      )}
    </article>
  );
}
