import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { BookingActions } from "@/components/bookings/booking-actions";
import { BookingChatButton } from "@/components/chat/booking-chat-button";
import { PageShell } from "@/components/shared/page-shell";
import { getOptionalSessionUser, isAdmin } from "@/lib/auth/session";
import {
  getBookingNextStepLabel,
  getBookingStatusDescription,
  getBookingStatusLabel,
} from "@/lib/constants/site";
import { formatDateTimeLabel } from "@/lib/date-time";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import type { BookingStatus } from "@/lib/types";

type BookingDetailRecord = Prisma.BookingGetPayload<{
  include: {
    customer: true;
    tradesman: true;
    service: true;
    quoteRequest: true;
  };
}>;

function toUiBookingStatus(status: BookingDetailRecord["status"]): BookingStatus {
  // DB enum은 대문자라서, 화면에서 쓰는 소문자 상태값으로 한 번 바꿔 준다.
  // 이렇게 중간 변환층을 두면 Prisma 상태와 UI 상태가 섞여도 화면 코드는 단순하게 유지된다.
  switch (status) {
    case "PENDING":
      return "pending";
    case "ACCEPTED":
      return "accepted";
    case "IN_PROGRESS":
      return "in-progress";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
  let booking: BookingDetailRecord | null = null;

  try {
    booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        tradesman: true,
        service: true,
        quoteRequest: true,
      },
    });
  } catch {
    notFound();
  }

  if (!booking) {
    notFound();
  }

  const canView =
    booking.customerId === sessionUser.id ||
    booking.tradesmanId === sessionUser.id ||
    isAdmin(sessionUser.role);

  if (!canView) {
    notFound();
  }

  const title =
    booking.service?.title ?? booking.quoteRequest?.title ?? `${text.bookingsEyebrow} #${booking.id.slice(-6)}`;
  const currentStatus: BookingStatus = toUiBookingStatus(booking.status);
  const statusLabel = getBookingStatusLabel(locale, currentStatus);
  const statusDescription = getBookingStatusDescription(locale, currentStatus);
  const nextStepLabel = getBookingNextStepLabel(locale, currentStatus);
  const canManageProgress =
    sessionUser.role === "admin" ||
    booking.tradesmanId === sessionUser.id;
  return (
    <PageShell
      eyebrow={text.bookingsEyebrow}
      title={title}
      description={text.bookingsDescription}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="soft-card p-5">
          <p className="text-sm font-bold text-teal-700">{text.bookingsCustomerLabel}</p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {booking.customer.fullName}
          </p>
          <p className="mt-4 text-sm font-bold text-teal-700">{text.bookingsTradesmanLabel}</p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {booking.tradesman.fullName}
          </p>
          <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              {text.bookingActionsStatusNoteLabel}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{nextStepLabel}</p>
          </div>
          <div className="mt-5">
            <BookingChatButton
              bookingId={booking.id}
              label={text.quotesChatButton}
              pendingLabel={text.quotesChatPending}
              errorLabel={text.quotesChatError}
            />
          </div>
        </article>

        <>
            <article className="soft-card p-5">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {text.bookingStatusSummaryTitle}
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
                  <dd className="mt-1">{booking.id}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-950">{text.bookingStatusCurrentLabel}</dt>
                  <dd className="mt-1">{statusLabel}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-950">{text.bookingActionsScheduleLabel}</dt>
                  <dd className="mt-1">
                    {formatDateTimeLabel(locale, booking.scheduledAt.toISOString())}
                  </dd>
                </div>
                {booking.completedAt ? (
                  <div>
                    <dt className="font-bold text-slate-950">{text.bookingDetailCompletedAtLabel}</dt>
                    <dd className="mt-1">
                      {formatDateTimeLabel(locale, booking.completedAt.toISOString())}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-bold text-slate-950">Address</dt>
                  <dd className="mt-1">{booking.workAddress}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-950">Amount</dt>
                  <dd className="mt-1">{`PHP ${booking.finalAmount.toString()}`}</dd>
                </div>
              </dl>
            </article>

            <BookingActions
                bookingId={booking.id}
                status={currentStatus}
                initialScheduledAt={booking.scheduledAt.toISOString()}
                locale={locale}
                statusNote={nextStepLabel}
                canManageProgress={canManageProgress}
                text={{
                  title: text.bookingActionsTitle,
                  description: text.bookingActionsDescription,
                  acceptAction: text.bookingActionsAcceptAction,
                acceptPending: text.bookingActionsAcceptPending,
                acceptSuccess: text.bookingActionsAcceptSuccess,
                acceptError: text.bookingActionsAcceptError,
                startAction: text.bookingActionsStartAction,
                startPending: text.bookingActionsStartPending,
                startSuccess: text.bookingActionsStartSuccess,
                startError: text.bookingActionsStartError,
                scheduleLabel: text.bookingActionsScheduleLabel,
                scheduleHint: text.bookingActionsScheduleHint,
                scheduleAction: text.bookingActionsScheduleAction,
                schedulePending: text.bookingActionsSchedulePending,
                scheduleSuccess: text.bookingActionsScheduleSuccess,
                scheduleError: text.bookingActionsScheduleError,
                completeAction: text.bookingActionsCompleteAction,
                completePending: text.bookingActionsCompletePending,
                completeSuccess: text.bookingActionsCompleteSuccess,
                completeError: text.bookingActionsCompleteError,
                scheduleLockedNote: text.bookingActionsScheduleLocked,
                completeLockedNote: text.bookingActionsCompleteLocked,
                progressPermissionNote: text.bookingActionsProgressPermissionNote,
                statusNoteLabel: text.bookingActionsStatusNoteLabel,
              }}
            />
          </>
      </section>
    </PageShell>
  );
}
