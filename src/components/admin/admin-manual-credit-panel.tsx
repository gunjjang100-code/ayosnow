"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type WalletTopupHistoryItem = {
  id: string;
  amount: number;
  status: string;
  createdAtLabel: string;
};

interface WalletTopupItem {
  userId: string;
  fullName: string;
  balance: string;
  history: WalletTopupHistoryItem[];
}

interface AdminManualCreditPanelProps {
  items: WalletTopupItem[];
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

export function AdminManualCreditPanel({ items }: AdminManualCreditPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleTopup(userId: string, fullName: string) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const accepted = window.confirm(
      `${fullName} 전문가에게 200 PHP를 수동 충전하시겠어요?\n이 기능은 운영 보조용입니다.`,
    );

    if (!accepted) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/wallet-topups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount: 200,
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

        const firstFieldError = result?.error?.fieldErrors
          ? Object.values(result.error.fieldErrors).flat().find(Boolean)
          : null;

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? "수동 충전에 실패했습니다.");
        return;
      }

      setSuccessMessage(`${fullName} 전문가에게 200 PHP를 수동 충전했습니다.`);
      router.refresh();
    });
  }

  function handleRefund(topupPaymentId: string) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const accepted = window.confirm(
      "이 충전 건을 환불하시겠어요?\n이미 환불된 건은 다시 환불할 수 없습니다.",
    );

    if (!accepted) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/wallet-topups", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletTopupPaymentId: topupPaymentId,
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

        const firstFieldError = result?.error?.fieldErrors
          ? Object.values(result.error.fieldErrors).flat().find(Boolean)
          : null;

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? "환불 처리에 실패했습니다.");
        return;
      }

      setSuccessMessage("환불 처리가 완료되었습니다.");
      router.refresh();
    });
  }

  return (
    <article className="panel-shell p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">전문가 지갑 운영 보조</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            기본 원칙은 전문가 직접 충전입니다. 이 화면은 운영 이슈가 있을 때 관리자에게 필요한
            최소한의 수동 충전·환불 기능만 제공합니다.
          </p>
        </div>
        <span className="chip">운영 보조</span>
      </div>

      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <section key={item.userId} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-bold text-slate-950">{item.fullName}</p>
                <p className="mt-1 text-sm text-slate-600">현재 잔액: {item.balance} PHP</p>
              </div>
              <button
                type="button"
                onClick={() => handleTopup(item.userId, item.fullName)}
                disabled={isPending}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPending ? "처리 중..." : "+200 PHP 수동 충전"}
              </button>
            </div>

            {item.history.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {item.history.map((historyItem) => (
                  <div
                    key={historyItem.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">+{historyItem.amount} PHP</p>
                      <p className="mt-1 text-xs text-slate-500">{historyItem.createdAtLabel}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="chip">{getStatusLabel(historyItem.status)}</span>
                      {historyItem.status === "PAID" ? (
                        <button
                          type="button"
                          onClick={() => handleRefund(historyItem.id)}
                          disabled={isPending}
                          className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          환불
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">아직 충전 기록이 없습니다.</p>
            )}
          </section>
        ))}
      </div>

      {errorMessage ? <p className="mt-4 text-sm font-medium text-rose-600">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-4 text-sm font-medium text-emerald-700">{successMessage}</p> : null}
    </article>
  );
}
