"use client";

import { useState } from "react";

import {
  getBookingNextStepLabel,
  getBookingStatusDescription,
  getBookingStatusLabel,
} from "@/lib/constants/site";
import { formatDateTimeLabel } from "@/lib/date-time";
import type { Locale, BookingStatus } from "@/lib/types";

import { BookingActions, type BookingActionsText } from "@/components/bookings/booking-actions";

interface DemoBookingDetailProps {
  bookingId: string;
  locale: Locale;
  initialStatus: BookingStatus;
  initialScheduledAt: string;
  initialCompletedAt?: string | null;
  addressLabel: string;
  amountLabel: string;
  summaryTitle: string;
  statusCurrentLabel: string;
  completedAtLabel: string;
  actionText: BookingActionsText;
  canManageProgress: boolean;
}

export function DemoBookingDetail({
  bookingId,
  locale,
  initialStatus,
  initialScheduledAt,
  initialCompletedAt = null,
  addressLabel,
  amountLabel,
  summaryTitle,
  statusCurrentLabel,
  completedAtLabel,
  actionText,
  canManageProgress,
}: DemoBookingDetailProps) {
  const [status, setStatus] = useState<BookingStatus>(initialStatus);
  const [scheduledAtIso, setScheduledAtIso] = useState(initialScheduledAt);
  const [completedAtIso, setCompletedAtIso] = useState<string | null>(initialCompletedAt);

  const statusLabel = getBookingStatusLabel(locale, status);
  const statusDescription = getBookingStatusDescription(locale, status);
  const nextStepLabel = getBookingNextStepLabel(locale, status);

  return (
    <>
      <article className="soft-card p-5">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {summaryTitle}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              {statusLabel}
            </span>
            <span className="text-sm font-medium text-slate-600">{nextStepLabel}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{statusDescription}</p>
        </div>

        <dl className="grid gap-4 text-sm text-slate-700">
          <div className="mt-5">
            <dt className="font-bold text-slate-950">ID</dt>
            <dd className="mt-1">{bookingId}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-950">{statusCurrentLabel}</dt>
            <dd className="mt-1">{statusLabel}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-950">Schedule</dt>
            <dd className="mt-1">{formatDateTimeLabel(locale, scheduledAtIso)}</dd>
          </div>
          {status === "completed" && completedAtIso ? (
            <div>
              <dt className="font-bold text-slate-950">{completedAtLabel}</dt>
              <dd className="mt-1">{formatDateTimeLabel(locale, completedAtIso)}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-bold text-slate-950">Address</dt>
            <dd className="mt-1">{addressLabel}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-950">Amount</dt>
            <dd className="mt-1">{amountLabel}</dd>
          </div>
        </dl>
      </article>

      <BookingActions
        bookingId={bookingId}
        status={status}
        initialScheduledAt={scheduledAtIso}
        locale={locale}
        statusNote={nextStepLabel}
        demoMode
        canManageProgress={canManageProgress}
        onDemoStatusChange={setStatus}
        onDemoScheduleChange={setScheduledAtIso}
        onDemoCompletedAtChange={setCompletedAtIso}
        text={actionText}
      />
    </>
  );
}
