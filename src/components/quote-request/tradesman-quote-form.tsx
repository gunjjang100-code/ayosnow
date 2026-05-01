"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface TradesmanQuoteFormProps {
  quoteRequestId: string;
  defaultAmount?: string;
  defaultVisitDate?: string;
  defaultMessage?: string;
  currentBalance: string;
  isEditingExistingQuote: boolean;
  isLocked: boolean;
  lockedMessage: string;
}

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
  defaultAmount,
  defaultVisitDate,
  defaultMessage,
  currentBalance,
  isEditingExistingQuote,
  isLocked,
  lockedMessage,
}: TradesmanQuoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [balanceLabel, setBalanceLabel] = useState(currentBalance);
  const balanceNumber = Number(balanceLabel);
  const isBalanceInsufficient = Number.isFinite(balanceNumber) && balanceNumber < 40;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isEditingExistingQuote && isBalanceInsufficient) {
      setErrorMessage("크레딧이 부족합니다. 충전해주세요.");
      return;
    }

    const isConfirmed = window.confirm(
      isEditingExistingQuote
        ? "이미 제출한 견적을 수정합니다. 추가 차감은 없습니다."
        : "이 요청에 견적을 제출하면 40 PHP가 차감됩니다.",
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

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? "견적을 저장하지 못했습니다.");
        return;
      }

      if (result?.remainingBalance) {
        setBalanceLabel(result.remainingBalance);
      }

      setSuccessMessage(
        result?.wasCharged === false
          ? "견적이 수정되었습니다. 이번 수정에는 추가 차감이 없습니다."
          : "견적이 저장되었습니다. 40 PHP가 차감되었고, 고객 화면에서 이제 이 견적을 비교할 수 있습니다.",
      );
      router.refresh();
    });
  }

  if (isLocked) {
    return (
      <article className="soft-card p-5">
        <p className="text-sm font-bold text-slate-950">전문가 견적 제출</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">{lockedMessage}</p>
      </article>
    );
  }

  return (
    <article className="soft-card p-5">
      <p className="text-sm font-bold text-slate-950">전문가 견적 제출</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        금액, 방문 가능 시간, 고객에게 보낼 짧은 설명을 적고 저장해 주세요.
      </p>
      <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
        <p className="font-bold">현재 크레딧: {balanceLabel} PHP</p>
        <p className="mt-1 text-xs leading-5 text-teal-800">
          {isEditingExistingQuote
            ? "이미 보낸 견적은 수정만 할 수 있고, 수정 자체에는 추가 차감이 없습니다."
            : "새 견적을 한 번 제출할 때마다 40 PHP가 차감됩니다."}
        </p>
      </div>
      {!isEditingExistingQuote && isBalanceInsufficient ? (
        <p className="mt-3 text-sm font-medium text-rose-600">
          크레딧이 부족합니다. 충전해주세요.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">견적 금액 (PHP)</label>
          <input
            name="amount"
            type="number"
            min={100}
            defaultValue={defaultAmount}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            placeholder="1800"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">방문 가능 시간</label>
          <input
            name="visitDate"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(defaultVisitDate)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">고객에게 보낼 설명</label>
          <textarea
            name="message"
            defaultValue={defaultMessage}
            className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            placeholder="예: 오늘 저녁 6시 방문 가능합니다. 기본 분해 청소와 필터 세척까지 포함해 진행하겠습니다."
          />
        </div>

        {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm font-medium text-emerald-700">{successMessage}</p> : null}

        <button
          type="submit"
          disabled={isPending || (!isEditingExistingQuote && isBalanceInsufficient)}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending
            ? "견적 저장 중..."
            : isEditingExistingQuote
              ? "견적 수정 저장"
              : "40 PHP 차감 후 견적 보내기"}
        </button>
      </form>
    </article>
  );
}
