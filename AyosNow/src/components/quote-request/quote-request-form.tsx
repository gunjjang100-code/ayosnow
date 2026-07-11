"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CategorySelect } from "@/components/quote-request/category-select";
import { copy } from "@/lib/i18n";
import type { Category, Locale } from "@/lib/types";

interface QuoteRequestFormProps {
  locale: Locale;
  initialCategories: Category[];
}

export function QuoteRequestForm({
  locale,
  initialCategories,
}: QuoteRequestFormProps) {
  const router = useRouter();
  const text = copy[locale];
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [detailHref, setDetailHref] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setDetailHref(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    startTransition(async () => {
      const response = await fetch("/api/quote-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // 여기서도 userId는 보내지 않는다.
        // 소유자는 서버가 쿠키 세션을 기준으로 결정해야 안전하다.
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
        | {
            error?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
            quoteRequestId?: string;
            matchedTradesmenCount?: number;
          }
        | null;

      if (!response.ok || !result?.quoteRequestId) {
        const fieldErrors = result?.error?.fieldErrors;
        const firstFieldError = fieldErrors
          ? Object.values(fieldErrors).flat().find(Boolean)
          : null;

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? text.quoteRequestSubmitError);
        return;
      }

      const matchedCount = result.matchedTradesmenCount ?? 0;
      setSuccessMessage(
        `${text.quoteRequestSuccess} ${text.quoteRequestMatchedExperts} ${matchedCount}`,
      );
      setDetailHref(`/quote-requests/${result.quoteRequestId}`);
      formElement.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="panel-shell grid gap-4 p-4 md:p-5">
      <div className="mobile-section-card bg-slate-50/70">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">
            {text.quoteRequestStepServiceTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {text.quoteRequestStepServiceDescription}
          </p>
        </div>
        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">
              {text.quoteRequestServiceType}
            </label>
            <CategorySelect
              key={locale}
              name="categorySlug"
              defaultValue={initialCategories[0]?.slug}
              initialCategories={initialCategories}
            />
          </div>
          <div>
            <label htmlFor="quote-request-title" className="mb-2 block text-sm font-bold text-slate-800">
              {text.quoteRequestTitleLabel}
            </label>
            <input
              id="quote-request-title"
              name="title"
              className="mobile-field"
              placeholder={text.quoteRequestTitlePlaceholder}
            />
          </div>
        </div>
      </div>

      <div className="mobile-section-card">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">
            {text.quoteRequestStepDetailTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {text.quoteRequestStepDetailDescription}
          </p>
        </div>
        <label htmlFor="quote-request-description" className="mb-2 block text-sm font-bold text-slate-800">
          {text.quoteRequestDescriptionLabel}
        </label>
        <textarea
          id="quote-request-description"
          name="description"
          className="mobile-field min-h-36 resize-y"
          placeholder={text.quoteRequestDescriptionPlaceholder}
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {text.quoteRequestDescriptionHint}
        </p>
      </div>

      <div className="mobile-section-card">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">
            {text.quoteRequestStepScheduleTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {text.quoteRequestStepScheduleDescription}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="quote-request-city" className="mb-2 block text-sm font-bold text-slate-800">
              {text.quoteRequestLocationLabel}
            </label>
            <input
              id="quote-request-city"
              name="city"
              className="mobile-field"
              placeholder={text.quoteRequestLocationPlaceholder}
            />
          </div>
          <div>
            <label htmlFor="quote-request-address" className="mb-2 block text-sm font-bold text-slate-800">
              {text.quoteRequestAddressLabel}
            </label>
            <input
              id="quote-request-address"
              name="addressLine"
              className="mobile-field"
              placeholder={text.quoteRequestAddressPlaceholder}
            />
          </div>
          <div>
            <label htmlFor="quote-request-target-date" className="mb-2 block text-sm font-bold text-slate-800">
              {text.quoteRequestDateLabel}
            </label>
            <input
              id="quote-request-target-date"
              name="targetDate"
              type="date"
              className="mobile-field"
            />
          </div>
          <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50 p-4 text-xs leading-6 text-teal-900">
            {text.quoteRequestNotificationHint}
          </div>
        </div>
      </div>

      <div className="mobile-section-card">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">
            {text.quoteRequestStepBudgetTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {text.quoteRequestStepBudgetDescription}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="quote-request-budget-min" className="mb-2 block text-sm font-bold text-slate-800">
              {text.quoteRequestMinBudgetLabel}
            </label>
            <input
              id="quote-request-budget-min"
              name="budgetMin"
              type="number"
              className="mobile-field"
              placeholder="1500"
            />
          </div>
          <div>
            <label htmlFor="quote-request-budget-max" className="mb-2 block text-sm font-bold text-slate-800">
              {text.quoteRequestMaxBudgetLabel}
            </label>
            <input
              id="quote-request-budget-max"
              name="budgetMax"
              type="number"
              className="mobile-field"
              placeholder="5000"
            />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>{successMessage}</p>
          {detailHref ? (
            <button
              type="button"
              onClick={() => router.push(detailHref)}
              className="mt-2 font-semibold text-emerald-700"
            >
              {text.quoteRequestSeeDetails}
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mobile-primary-button sticky bottom-20 z-10 w-full sm:static"
      >
        {isPending ? text.quoteRequestSubmitting : text.quoteRequestSubmitButton}
      </button>
    </form>
  );
}
