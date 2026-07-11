"use client";

import { useState } from "react";
import type { AccountDeletionRequestStatus, AccountStatus, UserRole } from "@prisma/client";

interface AdminAccountDeletionPanelProps {
  items: Array<{
    id: string;
    status: AccountDeletionRequestStatus;
    reason: string | null;
    requestedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
    user: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
      status: AccountStatus;
    };
    reviewerAdmin: {
      fullName: string;
      email: string;
    } | null;
  }>;
}

export function AdminAccountDeletionPanel({ items }: AdminAccountDeletionPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reviewRequest(requestId: string, status: "COMPLETED" | "CANCELLED") {
    const reviewNote =
      status === "COMPLETED"
        ? "Account deletion completed by admin review."
        : "Account deletion request cancelled by admin review.";

    setBusyId(requestId);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/account-deletions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status, reviewNote }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not review the account deletion request.");
      }

      setNotice("Account deletion request updated. Refresh to see the latest status.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not review the account deletion request.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel-shell p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Account deletion requests</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review user account deletion requests. Completing a request disables future sign-in.
          </p>
        </div>
        <span className="chip">{items.filter((item) => item.status === "PENDING").length} pending</span>
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl bg-teal-50 p-4 text-sm font-semibold text-teal-800">{notice}</p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No account deletion requests yet.
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{item.user.fullName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.user.email} · {item.user.role} · {item.user.status}
                  </p>
                </div>
                <span className="chip">{item.status}</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {item.reason || "No reason provided."}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Requested {item.requestedAt}
              </p>

              {item.status === "PENDING" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => reviewRequest(item.id, "COMPLETED")}
                    className="min-h-11 rounded-full bg-red-700 px-4 py-2 text-sm font-black !text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Complete deletion
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => reviewRequest(item.id, "CANCELLED")}
                    className="min-h-11 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    Cancel request
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Reviewed by {item.reviewerAdmin?.fullName ?? "admin"}.
                  {item.reviewNote ? ` ${item.reviewNote}` : ""}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
