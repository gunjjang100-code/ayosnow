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
      return "Top-up completed";
    case "PENDING":
      return "Top-up pending";
    case "FAILED":
      return "Top-up failed";
    case "REFUNDED":
      return "Refunded";
    case "EXPIRED":
      return "Expired";
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

    const accepted = window.confirm(`Add 200 PHP credits to ${fullName}?`);

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

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? "Could not add credits.");
        return;
      }

      setSuccessMessage(`Added 200 PHP credits to ${fullName}.`);
      router.refresh();
    });
  }

  function handleRefund(topupPaymentId: string) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const accepted = window.confirm(
      "Refund this top-up?\nAlready refunded records cannot be refunded again.",
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

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? "Could not process the refund.");
        return;
      }

      setSuccessMessage("Refund completed.");
      router.refresh();
    });
  }

  return (
    <article className="panel-shell p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Professional credit management</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review professional credit balances, top-up history, and adjustments.
          </p>
        </div>
        <span className="chip">Admin managed</span>
      </div>

      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <section key={item.userId} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-bold text-slate-950">{item.fullName}</p>
                <p className="mt-1 text-sm text-slate-600">Current balance: {item.balance} PHP</p>
              </div>
              <button
                type="button"
                onClick={() => handleTopup(item.userId, item.fullName)}
                disabled={isPending}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPending ? "Processing..." : "Add 200 PHP"}
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
                          Refund
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No top-up history yet.</p>
            )}
          </section>
        ))}
      </div>

      {errorMessage ? <p className="mt-4 text-sm font-medium text-rose-600">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-4 text-sm font-medium text-emerald-700">{successMessage}</p> : null}
    </article>
  );
}
