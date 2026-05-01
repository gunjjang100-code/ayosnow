"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toDateTimeLocalValueInZone } from "@/lib/date-time";
import type { BookingStatus } from "@/lib/types";

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
  scheduleLockedNote: string;
  completeLockedNote: string;
  progressPermissionNote: string;
  statusNoteLabel: string;
}

interface BookingActionsProps {
  bookingId: string;
  status: BookingStatus;
  initialScheduledAt: string;
  locale: "ko" | "fil" | "en";
  statusNote: string;
  text: BookingActionsText;
  demoMode?: boolean;
  canManageProgress?: boolean;
  onDemoStatusChange?: (status: BookingStatus) => void;
  onDemoScheduleChange?: (scheduledAtIso: string) => void;
  onDemoCompletedAtChange?: (completedAtIso: string | null) => void;
}

export function BookingActions({
  bookingId,
  status,
  initialScheduledAt,
  locale,
  statusNote,
  text,
  demoMode = false,
  canManageProgress = true,
  onDemoStatusChange,
  onDemoScheduleChange,
  onDemoCompletedAtChange,
}: BookingActionsProps) {
  const router = useRouter();
  const [scheduledAt, setScheduledAt] = useState(() =>
    toDateTimeLocalValueInZone(locale, initialScheduledAt),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUpdatingStatus, startUpdatingStatus] = useTransition();
  const [isRescheduling, startRescheduling] = useTransition();
  const [isCompleting, startCompleting] = useTransition();
  const currentStatus = status;
  const canReschedule =
    canManageProgress &&
    currentStatus !== "completed" && currentStatus !== "cancelled";
  const canComplete =
    canManageProgress &&
    (currentStatus === "accepted" || currentStatus === "in-progress");
  const canAccept = canManageProgress && currentStatus === "pending";
  const canStart = canManageProgress && currentStatus === "accepted";

  function handleStatusUpdate(nextStatus: "accepted" | "in-progress") {
    if (!canManageProgress) {
      setFeedback(text.progressPermissionNote);
      return;
    }

    if (demoMode) {
      onDemoStatusChange?.(nextStatus);
      // 데모 화면에서는 완료 상태를 다시 벗어나면 완료 시각도 같이 비운다.
      // 그래야 "예전에 완료됐던 흔적"이 남아서 화면이 헷갈리지 않는다.
      onDemoCompletedAtChange?.(null);
      setFeedback(
        nextStatus === "accepted" ? text.acceptSuccess : text.startSuccess,
      );
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
        setFeedback(
          result?.error ??
            (nextStatus === "accepted" ? text.acceptError : text.startError),
        );
        return;
      }

      setFeedback(
        nextStatus === "accepted" ? text.acceptSuccess : text.startSuccess,
      );
      router.refresh();
    });
  }

  function handleReschedule() {
    if (!canManageProgress) {
      setFeedback(text.progressPermissionNote);
      return;
    }

    if (!canReschedule) {
      setFeedback(text.scheduleLockedNote);
      return;
    }

    if (demoMode) {
      const nextSchedule = new Date(scheduledAt);
      onDemoScheduleChange?.(nextSchedule.toISOString());
      setFeedback(text.scheduleSuccess);
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
        setFeedback(result?.error ?? text.scheduleError);
        return;
      }

      setFeedback(text.scheduleSuccess);
      router.refresh();
    });
  }

  function handleComplete() {
    if (!canManageProgress) {
      setFeedback(text.progressPermissionNote);
      return;
    }

    if (!canComplete) {
      setFeedback(text.completeLockedNote);
      return;
    }

    if (demoMode) {
      onDemoStatusChange?.("completed");
      // 데모 예약도 완료 버튼을 눌렀을 때 "언제 끝났는지"가 보여야
      // 방문 시간과 작업 종료 시점을 구분해서 이해할 수 있다.
      onDemoCompletedAtChange?.(new Date().toISOString());
      setFeedback(text.completeSuccess);
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
        setFeedback(result?.error ?? text.completeError);
        return;
      }

      setFeedback(text.completeSuccess);
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
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingStatus ? text.acceptPending : text.acceptAction}
                </button>
              ) : null}
              {canStart ? (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate("in-progress")}
                  disabled={isUpdatingStatus}
                  className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
              />
              <span className="text-xs text-slate-500">{text.scheduleHint}</span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleReschedule}
                disabled={isRescheduling || !scheduledAt || !canReschedule}
                className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isRescheduling ? text.schedulePending : text.scheduleAction}
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isCompleting || isUpdatingStatus || !canComplete}
                className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
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
        ) : (
          // 고객 화면에서는 전문가 전용 조작을 아예 숨겨서
          // "보이지만 누를 수 없는 버튼" 때문에 헷갈리지 않게 한다.
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {text.progressPermissionNote}
          </div>
        )}
      </div>

      {feedback ? <p className="mt-4 text-sm font-medium text-teal-700">{feedback}</p> : null}
    </article>
  );
}
