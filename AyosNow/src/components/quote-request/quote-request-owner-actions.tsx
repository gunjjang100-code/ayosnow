"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CategorySelect } from "@/components/quote-request/category-select";
import type { Category, Locale } from "@/lib/types";

export interface QuoteRequestOwnerActionsText {
  title: string;
  description: string;
  saveAction: string;
  savePending: string;
  saveSuccess: string;
  saveError: string;
  cancelAction: string;
  cancelPending: string;
  cancelSuccess: string;
  cancelError: string;
  cancelConfirm: string;
  cancelConfirmAction: string;
  cancelKeepAction: string;
  cancelledNotice: string;
  closedNotice: string;
  dangerTitle: string;
  dangerDescription: string;
  serviceTypeLabel: string;
  titleLabel: string;
  descriptionLabel: string;
  locationLabel: string;
  addressLabel: string;
  dateLabel: string;
  minBudgetLabel: string;
  maxBudgetLabel: string;
}

interface QuoteRequestOwnerActionsProps {
  quoteRequestId: string;
  locale: Locale;
  categories: Category[];
  defaultValues: {
    categorySlug: string;
    title: string;
    description: string;
    city: string;
    addressLine: string;
    budgetMin: string;
    budgetMax: string;
    targetDate: string;
  };
  status: string;
  canEdit: boolean;
  text: QuoteRequestOwnerActionsText;
}

export function QuoteRequestOwnerActions({
  quoteRequestId,
  locale,
  categories,
  defaultValues,
  status,
  canEdit,
  text,
}: QuoteRequestOwnerActionsProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isCancelling, startCancelling] = useTransition();
  const isDisabled = isSaving || isCancelling;
  const isCancelled = status === "CANCELLED" || status === "cancelled";
  const fieldIdPrefix = `quote-request-${quoteRequestId}`;
  const cancelConfirmId = `${fieldIdPrefix}-cancel-confirm`;

  function readFirstError(result: { error?: unknown } | null) {
    if (!result?.error) {
      return null;
    }

    if (typeof result.error === "string") {
      return result.error;
    }

    const flattenedError = result.error as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
    const firstFieldError = flattenedError.fieldErrors
      ? Object.values(flattenedError.fieldErrors).flat().find(Boolean)
      : null;

    return firstFieldError ?? flattenedError.formErrors?.[0] ?? null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      setFeedback({
        message: isCancelled ? text.cancelledNotice : text.closedNotice,
        tone: "error",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    setFeedback(null);

    startSaving(async () => {
      const response = await fetch(`/api/quote-requests/${quoteRequestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        // 서버가 소유자와 상태를 다시 검사한다.
        // 화면 값은 편의를 위한 입력일 뿐, 최종 판단은 API가 한다.
        body: JSON.stringify({
          categorySlug: formData.get("categorySlug"),
          title: formData.get("title"),
          description: formData.get("description"),
          city: formData.get("city"),
          addressLine: formData.get("addressLine"),
          budgetMin: formData.get("budgetMin"),
          budgetMax: formData.get("budgetMax"),
          targetDate: formData.get("targetDate"),
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: unknown }
        | null;

      if (!response.ok) {
        setFeedback({
          message: readFirstError(result) ?? text.saveError,
          tone: "error",
        });
        return;
      }

      setFeedback({ message: text.saveSuccess, tone: "success" });
      router.refresh();
    });
  }

  function handleCancel() {
    if (!canEdit) {
      setFeedback({
        message: isCancelled ? text.cancelledNotice : text.closedNotice,
        tone: "error",
      });
      return;
    }

    if (!isConfirmingCancel) {
      setIsConfirmingCancel(true);
      return;
    }

    setFeedback(null);

    startCancelling(async () => {
      const response = await fetch(`/api/quote-requests/${quoteRequestId}`, {
        method: "DELETE",
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: unknown }
        | null;

      if (!response.ok) {
        setFeedback({
          message: readFirstError(result) ?? text.cancelError,
          tone: "error",
        });
        return;
      }

      setIsConfirmingCancel(false);
      setFeedback({ message: text.cancelSuccess, tone: "success" });
      router.refresh();
    });
  }

  if (!canEdit) {
    return (
      <article className="soft-card p-5">
        <p className="text-sm font-bold text-slate-950">{text.title}</p>
        <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {isCancelled ? text.cancelledNotice : text.closedNotice}
        </p>
      </article>
    );
  }

  return (
    <article className="soft-card p-4 md:p-5">
      <p className="text-sm font-bold text-teal-700">{text.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text.description}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-4 grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            {text.serviceTypeLabel}
          </label>
          <CategorySelect
            key={`${locale}-${defaultValues.categorySlug}`}
            name="categorySlug"
            defaultValue={defaultValues.categorySlug}
            initialCategories={categories}
          />
        </div>

        <div>
          <label htmlFor={`${fieldIdPrefix}-title`} className="mb-2 block text-sm font-bold text-slate-800">
            {text.titleLabel}
          </label>
          <input
            id={`${fieldIdPrefix}-title`}
            name="title"
            defaultValue={defaultValues.title}
            className="mobile-field"
          />
        </div>

        <div>
          <label htmlFor={`${fieldIdPrefix}-description`} className="mb-2 block text-sm font-bold text-slate-800">
            {text.descriptionLabel}
          </label>
          <textarea
            id={`${fieldIdPrefix}-description`}
            name="description"
            defaultValue={defaultValues.description}
            className="mobile-field min-h-32 resize-y"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={`${fieldIdPrefix}-city`} className="mb-2 block text-sm font-bold text-slate-800">
              {text.locationLabel}
            </label>
            <input
              id={`${fieldIdPrefix}-city`}
              name="city"
              defaultValue={defaultValues.city}
              className="mobile-field"
            />
          </div>
          <div>
            <label htmlFor={`${fieldIdPrefix}-address`} className="mb-2 block text-sm font-bold text-slate-800">
              {text.addressLabel}
            </label>
            <input
              id={`${fieldIdPrefix}-address`}
              name="addressLine"
              defaultValue={defaultValues.addressLine}
              className="mobile-field"
            />
          </div>
          <div>
            <label htmlFor={`${fieldIdPrefix}-target-date`} className="mb-2 block text-sm font-bold text-slate-800">
              {text.dateLabel}
            </label>
            <input
              id={`${fieldIdPrefix}-target-date`}
              name="targetDate"
              type="date"
              defaultValue={defaultValues.targetDate}
              className="mobile-field"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
            <div>
              <label htmlFor={`${fieldIdPrefix}-budget-min`} className="mb-2 block text-sm font-bold text-slate-800">
                {text.minBudgetLabel}
              </label>
              <input
                id={`${fieldIdPrefix}-budget-min`}
                name="budgetMin"
                type="number"
                defaultValue={defaultValues.budgetMin}
                className="mobile-field"
              />
            </div>
            <div>
              <label htmlFor={`${fieldIdPrefix}-budget-max`} className="mb-2 block text-sm font-bold text-slate-800">
                {text.maxBudgetLabel}
              </label>
              <input
                id={`${fieldIdPrefix}-budget-max`}
                name="budgetMax"
                type="number"
                defaultValue={defaultValues.budgetMax}
                className="mobile-field"
              />
            </div>
          </div>
        </div>

        {feedback ? (
          <div
            role={feedback.tone === "error" ? "alert" : "status"}
            aria-live={feedback.tone === "error" ? "assertive" : "polite"}
            className={
              feedback.tone === "error"
                ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
                : "rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800"
            }
          >
            {feedback.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isDisabled}
          aria-busy={isSaving}
          className="mobile-primary-button w-full"
        >
          {isSaving ? text.savePending : text.saveAction}
        </button>
      </form>

      <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-sm font-bold text-rose-800">{text.dangerTitle}</p>
        <p className="mt-2 text-sm leading-6 text-rose-700">{text.dangerDescription}</p>
        {isConfirmingCancel ? (
          <p
            id={cancelConfirmId}
            role="alert"
            className="mt-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-rose-800"
          >
            {text.cancelConfirm}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleCancel}
          disabled={isDisabled}
          aria-busy={isCancelling}
          aria-describedby={isConfirmingCancel ? cancelConfirmId : undefined}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-rose-700 px-5 text-sm font-black text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-rose-300 sm:w-auto"
        >
          {isCancelling ? text.cancelPending : isConfirmingCancel ? text.cancelConfirmAction : text.cancelAction}
        </button>
        {isConfirmingCancel ? (
          <button
            type="button"
            onClick={() => setIsConfirmingCancel(false)}
            disabled={isDisabled}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 text-sm font-black text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-3 sm:mt-4 sm:w-auto"
          >
            {text.cancelKeepAction}
          </button>
        ) : null}
      </div>
    </article>
  );
}
