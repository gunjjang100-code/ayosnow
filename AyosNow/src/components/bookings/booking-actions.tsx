"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toDateTimeLocalValueInZone } from "@/lib/date-time";
import type { BookingStatus, Locale } from "@/lib/types";

export interface BookingActionsText {
  title: string;
  description: string;
  acceptAction: string;
  acceptPending: string;
  acceptSuccess: string;
  acceptError: string;
  startAction: string;
  startPending: string;
  startSuccess: string;
  startError: string;
  scheduleLabel: string;
  scheduleHint: string;
  scheduleAction: string;
  schedulePending: string;
  scheduleSuccess: string;
  scheduleError: string;
  completeAction: string;
  completePending: string;
  completeSuccess: string;
  completeError: string;
  cancelTitle: string;
  cancelDescription: string;
  cancelAction: string;
  cancelPending: string;
  cancelSuccess: string;
  cancelError: string;
  cancelConfirm: string;
  cancelKeepAction: string;
  cancelLockedNote: string;
  scheduleLockedNote: string;
  completeLockedNote: string;
  progressPermissionNote: string;
  statusNoteLabel: string;
}

interface BookingActionsProps {
  bookingId: string;
  status: BookingStatus;
  initialScheduledAt: string;
  locale: Locale;
  statusNote: string;
  text: BookingActionsText;
  canManageProgress?: boolean;
  canCancelBooking?: boolean;
}

export function BookingActions({
  bookingId,
  status,
  initialScheduledAt,
  locale,
  statusNote,
  text,
  canManageProgress = true,
  canCancelBooking = false,
}: BookingActionsProps) {
  const router = useRouter();
  const [scheduledAt, setScheduledAt] = useState(() =>
    toDateTimeLocalValueInZone(locale, initialScheduledAt),
  );
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isUpdatingStatus, startUpdatingStatus] = useTransition();
  const [isRescheduling, startRescheduling] = useTransition();
  const [isCompleting, startCompleting] = useTransition();
  const [isCancelling, startCancelling] = useTransition();
  const currentStatus = status;
  const canReschedule =
    canManageProgress &&
    currentStatus !== "completed" && currentStatus !== "cancelled";
  const canComplete =
    canManageProgress &&
    (currentStatus === "accepted" || currentStatus === "in-progress");
  const canAccept = canManageProgress && currentStatus === "pending";
  const canStart = canManageProgress && currentStatus === "accepted";
  const canCancel =
    canCancelBooking &&
    currentStatus !== "completed" &&
    currentStatus !== "cancelled";

  function handleStatusUpdate(nextStatus: "accepted" | "in-progress") {
    if (!canManageProgress) {
      setFeedback({ message: text.progressPermissionNote, tone: "error" });
      return;
    }

    setFeedback(null);

    startUpdatingStatus(async () => {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          message:
            result?.error ??
            (nextStatus === "accepted" ? text.acceptError : text.startError),
          tone: "error",
        });
        return;
      }

      setFeedback({
        message:
          nextStatus === "accepted" ? text.acceptSuccess : text.startSuccess,
        tone: "success",
      });
      router.refresh();
    });
  }

  function handleReschedule() {
    if (!canManageProgress) {
      setFeedback({ message: text.progressPermissionNote, tone: "error" });
      return;
    }

    if (!canReschedule) {
      setFeedback({ message: text.scheduleLockedNote, tone: "error" });
      return;
    }

    setFeedback(null);

    startRescheduling(async () => {
      const nextSchedule = new Date(scheduledAt);

      const response = await fetch(`/api/bookings/${bookingId}/schedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduledAt: nextSchedule.toISOString(),
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          message: result?.error ?? text.scheduleError,
          tone: "error",
        });
        return;
      }

      setFeedback({ message: text.scheduleSuccess, tone: "success" });
      router.refresh();
    });
  }

  function handleComplete() {
    if (!canManageProgress) {
      setFeedback({ message: text.progressPermissionNote, tone: "error" });
      return;
    }

    if (!canComplete) {
      setFeedback({ message: text.completeLockedNote, tone: "error" });
      return;
    }

    setFeedback(null);

    startCompleting(async () => {
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: "PATCH",
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          message: result?.error ?? text.completeError,
          tone: "error",
        });
        return;
      }

      setFeedback({ message: text.completeSuccess, tone: "success" });
      router.refresh();
    });
  }

  function handleCancel() {
    if (!canCancel) {
      setFeedback({ message: text.cancelLockedNote, tone: "error" });
      return;
    }

    if (!isConfirmingCancel) {
      setIsConfirmingCancel(true);
      return;
    }

    setFeedback(null);

    startCancelling(async () => {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setFeedback({ message: result?.error ?? text.cancelError, tone: "error" });
        return;
      }

      setIsConfirmingCancel(false);
      setFeedback({ message: text.cancelSuccess, tone: "success" });
      router.refresh();
    });
  }

  return (
    <article className="soft-card p-5">
      <p className="text-sm font-bold text-teal-700">{text.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text.description}</p>
      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          {text.statusNoteLabel}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{statusNote}</p>
      </div>

      <div className="mt-5 grid gap-3">
        {canManageProgress ? (
          <>
            <div className="flex flex-wrap gap-3">
              {canAccept ? (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate("accepted")}
                  disabled={isUpdatingStatus}
                  aria-busy={isUpdatingStatus}
                  className="inline-flex min-h-11 items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingStatus ? text.acceptPending : text.acceptAction}
                </button>
              ) : null}
              {canStart ? (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate("in-progress")}
                  disabled={isUpdatingStatus}
                  aria-busy={isUpdatingStatus}
                  className="inline-flex min-h-11 items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingStatus ? text.startPending : text.startAction}
                </button>
              ) : null}
            </div>

            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-950">{text.scheduleLabel}</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
              />
              <span className="text-xs text-slate-500">{text.scheduleHint}</span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleReschedule}
                disabled={isRescheduling || !scheduledAt || !canReschedule}
                aria-busy={isRescheduling}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isRescheduling ? text.schedulePending : text.scheduleAction}
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isCompleting || isUpdatingStatus || !canComplete}
                aria-busy={isCompleting}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isCompleting ? text.completePending : text.completeAction}
              </button>
            </div>
            {!canReschedule ? (
              <p className="text-xs font-medium text-slate-500">{text.scheduleLockedNote}</p>
            ) : null}
            {!canComplete ? (
              <p className="text-xs font-medium text-slate-500">{text.completeLockedNote}</p>
            ) : null}
          </>
        ) : canCancelBooking ? null : (
          // 고객 화면에서는 전문가 전용 조작을 아예 숨겨서
          // "보이지만 누를 수 없는 버튼" 때문에 헷갈리지 않게 한다.
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {text.progressPermissionNote}
          </div>
        )}

        {canCancelBooking ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-bold text-rose-800">{text.cancelTitle}</p>
            <p className="mt-2 text-sm leading-6 text-rose-700">
              {text.cancelDescription}
            </p>
            {isConfirmingCancel ? (
              <p
                role="alert"
                className="mt-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-rose-800"
              >
                {text.cancelConfirm}
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling || isUpdatingStatus || isCompleting || !canCancel}
              aria-busy={isCancelling}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-rose-700 px-5 text-sm font-black text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-rose-300 sm:w-auto"
            >
              {isCancelling ? text.cancelPending : text.cancelAction}
            </button>
            {isConfirmingCancel ? (
              <button
                type="button"
                onClick={() => setIsConfirmingCancel(false)}
                disabled={isCancelling}
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 text-sm font-black text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-3 sm:mt-4 sm:w-auto"
              >
                {text.cancelKeepAction}
              </button>
            ) : null}
            {!canCancel ? (
              <p className="mt-3 text-xs font-medium leading-5 text-rose-700">
                {text.cancelLockedNote}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {feedback ? (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          aria-live={feedback.tone === "error" ? "assertive" : "polite"}
          className={
            feedback.tone === "error"
              ? "mt-4 text-sm font-medium text-rose-700"
              : "mt-4 text-sm font-medium text-teal-700"
          }
        >
          {feedback.message}
        </p>
      ) : null}
    </article>
  );
}
