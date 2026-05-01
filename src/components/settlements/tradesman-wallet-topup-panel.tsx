"use client";

import { useMemo, useState, useTransition } from "react";

const TOPUP_OPTIONS = [200, 400, 800] as const;

type WalletTopupHistoryItem = {
  id: string;
  amount: number;
  status: string;
  createdAtLabel: string;
};

interface TradesmanWalletTopupPanelProps {
  initialBalance: string;
  historyItems?: WalletTopupHistoryItem[];
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "충전 완료";
    case "PENDING":
      return "충전 대기";
    case "FAILED":
      return "충전 실패";
    case "REFUNDED":
      return "환불 완료";
    case "EXPIRED":
      return "만료";
    default:
      return status;
  }
}

export function TradesmanWalletTopupPanel({
  initialBalance,
  historyItems = [],
}: TradesmanWalletTopupPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    const accepted = window.confirm(
      `${amount} PHP 크레딧을 충전하시겠어요?\nPayMongo 웹훅 검증이 끝난 뒤에만 잔액에 반영됩니다.`,
    );

    if (!accepted) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/wallet-topups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
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

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? "충전창을 열지 못했습니다.");
        return;
      }

      if (!result?.checkoutUrl) {
        setErrorMessage("충전창 주소를 받지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      setSuccessMessage("PayMongo 크레딧 충전창으로 이동합니다.");
      window.location.href = result.checkoutUrl;
    });
  }

  return (
    <article className="panel-shell p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">전문가 크레딧 충전</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            견적을 보내기 전에 먼저 크레딧을 충전하는 곳입니다. PayMongo 절차가 끝나더라도 서버가 웹훅으로
            최종 확인한 뒤에만 잔액이 올라갑니다.
          </p>
        </div>
        <span className="chip">PayMongo</span>
      </div>

      <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3">
        <p className="text-sm font-medium text-teal-900">현재 크레딧</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{balanceLabel} PHP</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          새 견적을 한 번 제출할 때마다 40 PHP가 차감됩니다.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-600">
        충전 수단: <span className="font-semibold text-slate-900">GCash / Maya / Card</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {TOPUP_OPTIONS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handleTopup(amount)}
            disabled={isPending}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-sm font-medium text-slate-500">충전 패키지</p>
            <p className="mt-2 text-xl font-bold text-slate-950">+{amount} PHP</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              클릭하면 PayMongo 충전창으로 이동합니다.
            </p>
          </button>
        ))}
      </div>

      {historyItems.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-bold text-slate-950">최근 충전 기록</p>
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
                <span className="chip">{getStatusLabel(item.status)}</span>
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
        PayMongo 완료 화면만 보고 바로 충전하지 않습니다. PayMongo 웹훅 검증이 끝나야 실제 잔액이
        반영됩니다.
      </div>
    </article>
  );
}
