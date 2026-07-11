"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AdminTradesmanApprovalItem } from "@/lib/admin/tradesman-approval-service";

interface AdminTradesmanApprovalPanelProps {
  items: AdminTradesmanApprovalItem[];
}

function getStatusLabel(status: AdminTradesmanApprovalItem["latestStatus"]) {
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "NEEDS_CHANGES":
      return "Needs changes";
    case "PENDING":
      return "Pending review";
    case "NOT_SUBMITTED":
      return "No review yet";
    default:
      return status;
  }
}

export function AdminTradesmanApprovalPanel({
  items,
}: AdminTradesmanApprovalPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleReview(
    item: AdminTradesmanApprovalItem,
    status: "APPROVED" | "REJECTED" | "NEEDS_CHANGES",
  ) {
    setErrorMessage(null);
    setSuccessMessage(null);
    const reviewNote = reviewNotes[item.profileId]?.trim() ?? "";
    const isRevokingApproval = item.isVerified && status === "NEEDS_CHANGES";

    if ((status === "REJECTED" || status === "NEEDS_CHANGES") && !reviewNote) {
      setErrorMessage(
        isRevokingApproval
          ? "Add an admin review note before revoking approval."
          : "Add an admin review note before rejecting or requesting changes.",
      );
      return;
    }

    const actionLabel =
      status === "APPROVED"
        ? "approve"
        : status === "REJECTED"
          ? "reject"
          : isRevokingApproval
            ? "revoke approval for"
            : "request changes for";
    const accepted = window.confirm(`Do you want to ${actionLabel} ${item.fullName}?`);

    if (!accepted) {
      return;
    }

    setActiveProfileId(item.profileId);
    startTransition(async () => {
      const response = await fetch("/api/admin/tradesman-approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: item.profileId,
          status,
          reviewNote,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | string;
          }
        | null;

      setActiveProfileId(null);

      if (!response.ok) {
        if (typeof result?.error === "string") {
          setErrorMessage(result.error);
          return;
        }

        const firstFieldError = result?.error?.fieldErrors
          ? Object.values(result.error.fieldErrors).flat().find(Boolean)
          : null;

        setErrorMessage(firstFieldError ?? result?.error?.formErrors?.[0] ?? "Could not review this profile.");
        return;
      }

      setSuccessMessage(
        status === "APPROVED"
          ? `${item.fullName} is now approved.`
          : isRevokingApproval
            ? `${item.fullName} approval was revoked.`
            : `${item.fullName} review was saved.`,
      );
      router.refresh();
    });
  }

  return (
    <article className="panel-shell p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Professional document review</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review uploaded certificates, work photos, skills, and profile details before marking a professional as verified.
          </p>
        </div>
        <span className="chip">{items.length} profiles</span>
      </div>

      <div className="mt-5 grid gap-4">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No professional profiles are available for review yet.
          </p>
        ) : (
          items.map((item) => {
            const isActive = activeProfileId === item.profileId;
            const isBusy = isPending && isActive;
            const isApproved = item.isVerified || item.latestStatus === "APPROVED";

            return (
              <section
                key={item.profileId}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-950">{item.fullName}</h3>
                      <span className={item.isVerified ? "chip" : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"}>
                        {item.isVerified ? "Verified" : "Not verified"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                        {getStatusLabel(item.latestStatus)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.email}</p>
                    <p className="mt-3 font-bold text-slate-900">{item.headline}</p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{item.bio}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                      <span className="rounded-full bg-white px-3 py-1">Experience: {item.experienceYears} years</span>
                      <span className="rounded-full bg-white px-3 py-1">Radius: {item.serviceRadiusKm} km</span>
                      <span className="rounded-full bg-white px-3 py-1">Certificates: {item.certificationCount}</span>
                      <span className="rounded-full bg-white px-3 py-1">Portfolio: {item.portfolioCount}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Services: {item.serviceNames.length > 0 ? item.serviceNames.join(", ") : "No service skills selected"}
                    </p>
                    {item.latestReviewNote ? (
                      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                        Last admin note: {item.latestReviewNote}
                      </p>
                    ) : null}
                  </div>

                  <div className="w-full shrink-0 xl:w-80">
                    <label
                      htmlFor={`approval-note-${item.profileId}`}
                      className="text-sm font-bold text-slate-800"
                    >
                      Admin review note
                    </label>
                    <textarea
                      id={`approval-note-${item.profileId}`}
                      value={reviewNotes[item.profileId] ?? ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [item.profileId]: event.target.value,
                        }))
                      }
                      className="mobile-field mt-2 min-h-24 resize-y"
                      placeholder={
                        isApproved
                          ? "Required before revoking approval or rejecting"
                          : "Required for reject or needs changes"
                      }
                    />
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                      {isApproved ? (
                        <>
                          <button
                            type="button"
                            disabled
                            className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800"
                          >
                            Approved
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(item, "NEEDS_CHANGES")}
                            disabled={isPending}
                            className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "Saving..." : "Revoke approval"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReview(item, "APPROVED")}
                            disabled={isPending}
                            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            {isBusy ? "Saving..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(item, "NEEDS_CHANGES")}
                            disabled={isPending}
                            className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Needs changes
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleReview(item, "REJECTED")}
                        disabled={isPending}
                        className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>

      {errorMessage ? <p className="mt-4 text-sm font-medium text-rose-600">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-4 text-sm font-medium text-emerald-700">{successMessage}</p> : null}
    </article>
  );
}
