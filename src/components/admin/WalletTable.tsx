"use client";

import { useMemo, useState } from "react";

import type { AdminWalletRow } from "@/lib/admin/wallet-admin-service";
import { formatAdminDate, formatPhp } from "@/lib/utils";

const CREDIT_STEP = 200;

function getStatusLabel(status: AdminWalletRow["status"]) {
  if (status === "active") return "정상";
  if (status === "watch") return "주의";
  return "정지";
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
      alert("잔액이 부족해서 200 PHP를 차감할 수 없습니다.");
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
        throw new Error(result?.error ?? "지갑을 수정하지 못했습니다.");
      }

      setWallets((current) =>
        current.map((wallet) => (wallet.id === expertId ? result.wallet! : wallet)),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "지갑을 수정하지 못했습니다.";
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
            <h2 className="text-2xl font-black text-slate-950">전문가 지갑 관리</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              전문가별 크레딧 잔액과 거래 내역을 확인하고 필요한 조정을 처리합니다.
            </p>
          </div>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700">
            저장됨
          </span>
        </div>
        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 overflow-x-auto">
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
                        className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        +200 PHP
                      </button>
                      <button
                        type="button"
                        onClick={() => updateWallet(wallet.id, "deduct-credit")}
                        disabled={pendingWalletId === wallet.id}
                        className="rounded-full bg-orange-500 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        -200 PHP
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedWalletId(wallet.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        기록 보기
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedWallet ? (
        <article className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                {selectedWallet.name} 거래 기록
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                크레딧 추가/차감 내역을 최신순으로 보여줍니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWalletId(null)}
              className="rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-bold text-teal-700"
            >
              닫기
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {selectedWallet.history.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-teal-200 bg-white/70 p-4 text-sm text-slate-600">
                아직 거래 기록이 없습니다.
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
