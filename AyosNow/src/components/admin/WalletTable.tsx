"use client";

import { useMemo, useState } from "react";

import type { AdminWalletRow } from "@/lib/admin/wallet-admin-service";
import { formatAdminDate, formatPhp } from "@/lib/utils";

const CREDIT_STEP = 200;

function getStatusLabel(status: AdminWalletRow["status"]) {
  if (status === "active") return "Active";
  if (status === "watch") return "Watch";
  return "Suspended";
}

function getStatusClass(status: AdminWalletRow["status"]) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "watch") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

export function WalletTable({ initialWallets }: { initialWallets: AdminWalletRow[] }) {
  const [wallets, setWallets] = useState(initialWallets);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [pendingWalletId, setPendingWalletId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === selectedWalletId) ?? null,
    [selectedWalletId, wallets],
  );

  async function updateWallet(expertId: string, action: "add-credit" | "deduct-credit") {
    const target = wallets.find((wallet) => wallet.id === expertId);

    if (!target) return;

    if (action === "deduct-credit" && target.currentBalance < CREDIT_STEP) {
      alert("Insufficient balance to deduct 200 PHP.");
      return;
    }

    setPendingWalletId(expertId);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/wallets/${expertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          amount: CREDIT_STEP,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        error?: string;
        wallet?: AdminWalletRow;
      } | null;

      if (!response.ok || !result?.wallet) {
        throw new Error(result?.error ?? "Could not update the wallet.");
      }

      setWallets((current) =>
        current.map((wallet) => (wallet.id === expertId ? result.wallet! : wallet)),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update the wallet.";
      setErrorMessage(message);
      alert(message);
    } finally {
      setPendingWalletId(null);
    }
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Professional wallet management</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review credit balances and transaction history by professional.
            </p>
          </div>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700">
            Saved
          </span>
        </div>
        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {wallets.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No professional wallets yet.
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-3 md:hidden">
              {wallets.map((wallet) => (
                <article
                  key={wallet.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-slate-950">
                        {wallet.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        ID · {wallet.id.slice(-8)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(wallet.status)}`}
                    >
                      {getStatusLabel(wallet.status)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Credit balance
                    </p>
                    <p className="mt-2 text-2xl font-black text-teal-700">
                      {formatPhp(wallet.currentBalance)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => updateWallet(wallet.id, "add-credit")}
                      disabled={pendingWalletId === wallet.id}
                      className="min-h-12 rounded-full bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      +200 PHP
                    </button>
                    <button
                      type="button"
                      onClick={() => updateWallet(wallet.id, "deduct-credit")}
                      disabled={pendingWalletId === wallet.id}
                      className="min-h-12 rounded-full bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      -200 PHP
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWalletId(wallet.id)}
                      className="min-h-12 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition active:scale-[0.98]"
                    >
                      View history
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="min-w-[820px] w-full border-separate border-spacing-y-3 text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  <tr>
                    <th className="px-4">ID</th>
                    <th className="px-4">Name</th>
                    <th className="px-4">Credit Balance</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet.id} className="rounded-2xl bg-slate-50 align-middle">
                      <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-500">
                        {wallet.id}
                      </td>
                      <td className="px-4 py-4 font-black text-slate-950">{wallet.name}</td>
                      <td className="px-4 py-4 font-bold text-teal-700">
                        {formatPhp(wallet.currentBalance)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(wallet.status)}`}>
                          {getStatusLabel(wallet.status)}
                        </span>
                      </td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => updateWallet(wallet.id, "add-credit")}
                            disabled={pendingWalletId === wallet.id}
                            className="min-h-10 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            +200 PHP
                          </button>
                          <button
                            type="button"
                            onClick={() => updateWallet(wallet.id, "deduct-credit")}
                            disabled={pendingWalletId === wallet.id}
                            className="min-h-10 rounded-full bg-orange-500 px-3 py-2 text-xs font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            -200 PHP
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedWalletId(wallet.id)}
                            className="min-h-10 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition active:scale-[0.98]"
                          >
                            View history
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedWallet ? (
        <article className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                {selectedWallet.name} transaction history
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Credit additions and deductions are shown from newest to oldest.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWalletId(null)}
              className="min-h-11 w-full rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-bold text-teal-700 transition active:scale-[0.98] sm:w-auto"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {selectedWallet.history.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-teal-200 bg-white/70 p-4 text-sm text-slate-600">
                No transaction history yet.
              </p>
            ) : (
              selectedWallet.history.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-2xl border border-teal-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-bold text-slate-950">{transaction.memo}</p>
                    <p
                      className={
                        transaction.amount >= 0
                          ? "font-black text-emerald-700"
                          : "font-black text-rose-700"
                      }
                    >
                      {transaction.amount >= 0 ? "+" : ""}
                      {formatPhp(transaction.amount)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatAdminDate(transaction.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      ) : null}
    </section>
  );
}
