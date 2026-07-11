"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Locale } from "@/lib/types";

interface TradesmanQuoteFormProps {
  quoteRequestId: string;
  existingQuoteId?: string;
  defaultAmount?: string;
  defaultVisitDate?: string;
  defaultMessage?: string;
  currentBalance: string;
  isEditingExistingQuote: boolean;
  isLocked: boolean;
  lockedMessage: string;
  locale: Locale;
}

const quoteFormCopy = {
  en: {
    title: "Submit professional quote",
    description: "Enter the amount, available visit time, and a short note for the customer.",
    currentCredits: "Current credits",
    editCredit: "Existing quotes can be edited without another deduction.",
    firstCredit: "Each first quote submission deducts 40 PHP.",
    lowBalance: "Your credit balance is too low. Please top up first.",
    amount: "Quote amount (PHP)",
    visit: "Available visit time",
    message: "Message for the customer",
    placeholder: "Example: I can visit today at 6 PM. The basic service includes cleaning and filter washing.",
    editConfirm: "You are editing an existing quote. No extra credit will be deducted.",
    submitConfirm: "Submitting this quote will deduct 40 PHP.",
    saveError: "Could not save the quote.",
    updateSuccess: "The quote was updated. No extra credit was deducted.",
    submitSuccess: "The quote was saved. 40 PHP was deducted, and the customer can now compare it.",
    saving: "Saving quote...",
    saveChanges: "Save quote changes",
    send: "Send quote and deduct 40 PHP",
    withdraw: "Withdraw quote",
    withdrawConfirm: "Withdraw this quote? The customer will no longer be able to choose it. Credits are not automatically returned.",
    withdrawError: "Could not withdraw the quote.",
    withdrawSuccess: "The quote was withdrawn.",
  },
  fil: {
    title: "Magpadala ng professional quote",
    description: "Ilagay ang halaga, available visit time, at maikling mensahe para sa customer.",
    currentCredits: "Kasalukuyang credits",
    editCredit: "Maaaring i-edit ang parehong quote nang walang panibagong bawas.",
    firstCredit: "Magbabawas ng 40 PHP sa unang quote sa bawat request.",
    lowBalance: "Kulang ang credit balance mo. Mag-top up muna.",
    amount: "Halaga ng quote (PHP)",
    visit: "Available visit time",
    message: "Mensahe para sa customer",
    placeholder: "Halimbawa: Makakapunta ako ngayong 6 PM. Kasama sa basic service ang cleaning at filter washing.",
    editConfirm: "I-e-edit mo ang existing quote. Walang panibagong credit na ibabawas.",
    submitConfirm: "Magbabawas ng 40 PHP credits kapag ipinadala ang quote na ito.",
    saveError: "Hindi ma-save ang quote.",
    updateSuccess: "Na-update ang quote. Walang panibagong credit na ibinawas.",
    submitSuccess: "Na-save ang quote. Nabawas ang 40 PHP at maaari na itong ikumpara ng customer.",
    saving: "Sine-save ang quote...",
    saveChanges: "I-save ang pagbabago",
    send: "Ipadala at ibawas ang 40 PHP",
    withdraw: "Bawiin ang quote",
    withdrawConfirm: "Bawiin ang quote na ito? Hindi na ito mapipili ng customer at hindi awtomatikong ibabalik ang credits.",
    withdrawError: "Hindi mabawi ang quote.",
    withdrawSuccess: "Nabawi na ang quote.",
  },
} as const;

function toDatetimeLocalValue(value: string | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function TradesmanQuoteForm({
  quoteRequestId,
  existingQuoteId,
  defaultAmount,
  defaultVisitDate,
  defaultMessage,
  currentBalance,
  isEditingExistingQuote,
  isLocked,
  lockedMessage,
  locale,
}: TradesmanQuoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [balanceLabel, setBalanceLabel] = useState(currentBalance);
  const balanceNumber = Number(balanceLabel);
  const isBalanceInsufficient = Number.isFinite(balanceNumber) && balanceNumber < 40;
  const amountFieldId = `quote-amount-${quoteRequestId}`;
  const visitDateFieldId = `quote-visit-date-${quoteRequestId}`;
  const messageFieldId = `quote-message-${quoteRequestId}`;
  const feedbackId = `quote-feedback-${quoteRequestId}`;
  const text = quoteFormCopy[locale === "fil" ? "fil" : "en"];
  const policyNote =
    locale === "fil"
      ? "Ang 40 PHP credits ay para sa unang successful quote sa request na ito. Walang panibagong bawas sa pag-edit o muling pagpapadala ng parehong quote. Hindi ito awtomatikong ibinabalik kapag binawi, tinanggihan, o hindi napili ang quote. Kapag hindi nakumpleto ang submission, walang dapat ibawas."
      : "The 40 PHP credit fee applies to the first successful quote for this request. Editing or resubmitting the same quote does not deduct again. Credits are not automatically returned when the quote is withdrawn, rejected, or not selected. If submission does not complete, no fee should be charged.";

  function handleWithdraw() {
    if (!existingQuoteId) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const isConfirmed = window.confirm(text.withdrawConfirm);
    if (!isConfirmed) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/quotes/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId: existingQuoteId,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | string;
          }
        | null;

      if (!response.ok) {
        if (typeof result?.error === "string") {
          setErrorMessage(result.error);
          return;
        }

        const fieldErrors = result?.error?.fieldErrors;
        const firstFieldError = fieldErrors
          ? Object.values(fieldErrors).flat().find(Boolean)
          : null;

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? text.withdrawError);
        return;
      }

      setSuccessMessage(text.withdrawSuccess);
      router.refresh();
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isEditingExistingQuote && isBalanceInsufficient) {
      setErrorMessage(text.lowBalance);
      return;
    }

    const isConfirmed = window.confirm(
      isEditingExistingQuote
        ? text.editConfirm
        : text.submitConfirm,
    );

    if (!isConfirmed) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteRequestId,
          amount: formData.get("amount"),
          visitDate: formData.get("visitDate"),
          message: formData.get("message"),
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | string;
            quoteId?: string;
            remainingBalance?: string;
            wasCharged?: boolean;
          }
        | null;

      if (!response.ok) {
        if (typeof result?.error === "string") {
          setErrorMessage(result.error);
          return;
        }

        const fieldErrors = result?.error?.fieldErrors;
        const firstFieldError = fieldErrors
          ? Object.values(fieldErrors).flat().find(Boolean)
          : null;

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? text.saveError);
        return;
      }

      if (result?.remainingBalance) {
        setBalanceLabel(result.remainingBalance);
      }

      setSuccessMessage(
        result?.wasCharged === false
          ? text.updateSuccess
          : text.submitSuccess,
      );
      router.refresh();
    });
  }

  if (isLocked) {
    return (
      <article className="soft-card p-5">
        <p className="text-sm font-bold text-slate-950">{text.title}</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">{lockedMessage}</p>
      </article>
    );
  }

  return (
    <article className="soft-card p-4 md:p-5">
      <p className="text-lg font-black text-slate-950">{text.title}</p>
      <p className="mt-2 text-[15px] leading-7 text-slate-600">
        {text.description}
      </p>
      <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
        <p className="font-bold">{text.currentCredits}: {balanceLabel} PHP</p>
        <p className="mt-1 text-xs leading-5 text-teal-800">
          {isEditingExistingQuote
            ? text.editCredit
            : text.firstCredit}
        </p>
      </div>
      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-950">
        {policyNote}
      </p>
      {!isEditingExistingQuote && isBalanceInsufficient ? (
        <p className="mt-3 text-sm font-medium text-rose-600">
          {text.lowBalance}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4" aria-describedby={feedbackId}>
        <div>
          <label
            htmlFor={amountFieldId}
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            {text.amount}
          </label>
          <input
            id={amountFieldId}
            name="amount"
            type="number"
            min={100}
            defaultValue={defaultAmount}
            className="mobile-field"
            placeholder="1800"
          />
        </div>

        <div>
          <label
            htmlFor={visitDateFieldId}
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            {text.visit}
          </label>
          <input
            id={visitDateFieldId}
            name="visitDate"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(defaultVisitDate)}
            className="mobile-field"
          />
        </div>

        <div>
          <label
            htmlFor={messageFieldId}
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            {text.message}
          </label>
          <textarea
            id={messageFieldId}
            name="message"
            defaultValue={defaultMessage}
            className="mobile-field min-h-32 resize-y"
            placeholder={text.placeholder}
          />
        </div>

        <div id={feedbackId} role="status" aria-live="polite">
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              {successMessage}
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isPending || (!isEditingExistingQuote && isBalanceInsufficient)}
          className="mobile-primary-button sticky bottom-20 z-10 w-full sm:static"
        >
          {isPending
            ? text.saving
            : isEditingExistingQuote
              ? text.saveChanges
              : text.send}
        </button>
        {existingQuoteId ? (
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={isPending}
            className="mobile-secondary-button w-full border-rose-200 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {text.withdraw}
          </button>
        ) : null}
      </form>
    </article>
  );
}
