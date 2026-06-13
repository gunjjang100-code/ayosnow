import Link from "next/link";

import { listBookingPreviewsForUser } from "@/lib/bookings/list-bookings-service";
import { PageShell } from "@/components/shared/page-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import type { BookingStatus } from "@/lib/types";

function getBookingActionHint(
  status: BookingStatus,
  text: (typeof copy)["ko"],
) {
  if (status === "accepted" || status === "in-progress") {
    return text.bookingsActionHintManage;
  }

  if (status === "pending") {
    return text.bookingsActionHintPending;
  }

  return text.bookingsActionHintReadOnly;
}

export default async function BookingsPage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
  let bookings: Awaited<ReturnType<typeof listBookingPreviewsForUser>> = [];
  let loadFailed = false;

  try {
    bookings = await listBookingPreviewsForUser({
      sessionUserId: sessionUser.id,
      role: sessionUser.role,
      locale,
    });
  } catch {
    loadFailed = true;
  }

  return (
    <PageShell
      eyebrow={text.bookingsEyebrow}
      title={text.bookingsTitle}
      description={text.bookingsDescription}
    >
      {!loadFailed ? (
        <article className="rounded-3xl border border-teal-100 bg-teal-50 px-5 py-4 text-slate-800">
          <p className="text-sm font-bold text-teal-800">내 예약 현황</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            로그인한 계정에 연결된 예약만 표시합니다.
          </p>
        </article>
      ) : null}

      {loadFailed ? (
        <article className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
          <p className="text-sm font-bold text-amber-900">예약 데이터를 불러오지 못했습니다.</p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터에 문의해 주세요.
          </p>
        </article>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4">
          <article className="rounded-3xl border border-teal-100 bg-teal-50 px-5 py-4 text-slate-800">
            <p className="text-sm font-bold text-teal-800">{text.bookingsDetailGuideTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{text.bookingsDetailGuideDescription}</p>
          </article>
          {bookings.length === 0 ? (
            <article className="soft-card p-6">
              <p className="text-lg font-bold text-slate-950">{text.bookingsEmptyTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text.bookingsEmptyDescription}</p>
            </article>
          ) : null}
          {bookings.map((booking) => (
            <article key={booking.id} className="soft-card p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xl font-bold text-slate-950">{booking.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {text.bookingsCustomerLabel} {booking.customerName} · {text.bookingsTradesmanLabel}{" "}
                    {booking.tradesmanName}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {booking.location} · {booking.dateLabel}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <StatusBadge status={booking.status} locale={locale} />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    {booking.mode === "instant-booking"
                      ? text.bookingsInstantMode
                      : text.bookingsQuoteMode}
                  </span>
                  <p className="max-w-52 text-left text-xs leading-5 text-slate-500 md:text-right">
                    {getBookingActionHint(booking.status, text)}
                  </p>
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900 transition hover:border-teal-300 hover:bg-teal-100"
                  >
                    {text.bookingsManageButton}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <article className="soft-card p-5">
          <p className="text-lg font-bold text-slate-950">{text.bookingsFlowTitle}</p>
          <div className="mt-5 grid gap-3">
            {[
              text.bookingsFlow1,
              text.bookingsFlow2,
              text.bookingsFlow3,
              text.bookingsFlow4,
              text.bookingsFlow5,
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </PageShell>
  );
}
