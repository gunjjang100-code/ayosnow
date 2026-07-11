"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { copy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface InstantBookButtonProps {
  locale: Locale;
  serviceSlug: string;
}

export function InstantBookButton({
  locale,
  serviceSlug,
}: InstantBookButtonProps) {
  const router = useRouter();
  const text = copy[locale];
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [bookingHref, setBookingHref] = useState<string | null>(null);

  async function handleBooking() {
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/bookings/instant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // userId는 절대 보내지 않는다.
        // 서버가 쿠키 세션을 보고 "누가 예약했는지"를 직접 결정하게 만든다.
        body: JSON.stringify({
          serviceSlug,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; bookingId?: string }
        | null;

      if (!response.ok || !result?.bookingId) {
        setFeedback(result?.error ?? text.servicesBookingError);
        return;
      }

      const nextHref = `/bookings/${result.bookingId}`;
      setBookingHref(nextHref);
      setFeedback(text.servicesBookingSuccess);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <button
        type="button"
        onClick={handleBooking}
        disabled={isPending}
        className="w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-[0_16px_26px_-18px_rgba(15,23,42,0.7)] disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {isPending ? text.servicesBookingPending : text.servicesBookButton}
      </button>

      {feedback ? (
        <div className="w-full rounded-2xl bg-slate-50 px-3 py-2 text-left text-xs text-slate-600 sm:w-auto sm:text-right">
          <p>{feedback}</p>
          {bookingHref ? (
            <button
              type="button"
              onClick={() => router.push(bookingHref)}
              className="mt-1 font-semibold text-teal-700"
            >
              {text.servicesBookingGoTo}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
