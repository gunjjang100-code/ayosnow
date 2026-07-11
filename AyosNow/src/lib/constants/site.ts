import type { BookingStatus, Locale } from "@/lib/types";

export function getBookingStatusLabel(locale: Locale, status: BookingStatus): string {
  const map: Record<Locale, Record<BookingStatus, string>> = {
    fil: {
      pending: "Naghihintay",
      accepted: "Tinanggap",
      "in-progress": "Ginagawa",
      completed: "Tapos",
      cancelled: "Kinansela",
    },
    en: {
      pending: "Pending",
      accepted: "Accepted",
      "in-progress": "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    },
  };

  return map[locale][status];
}

export const bookingStatusStyleMap: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  accepted: "bg-sky-100 text-sky-900",
  "in-progress": "bg-violet-100 text-violet-900",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-rose-100 text-rose-900",
};

export function getBookingStatusDescription(
  locale: Locale,
  status: BookingStatus,
): string {
  const map: Record<Locale, Record<BookingStatus, string>> = {
    fil: {
      pending: "Hindi pa ito nasusuri ng tradesman.",
      accepted: "Tinanggap na ng tradesman ang iskedyul at naghahanda na sa pagbisita.",
      "in-progress": "Nagsimula na ang actual na trabaho sa site.",
      completed: "Tapos na ang trabaho at susunod na ang review.",
      cancelled: "Kinansela na ang booking kaya wala nang susunod na work action.",
    },
    en: {
      pending: "The tradesman has not reviewed this booking yet.",
      accepted: "The tradesman accepted the schedule and is preparing for the visit.",
      "in-progress": "The on-site work has already started.",
      completed: "The work is done and the flow now moves to review.",
      cancelled: "This booking was cancelled, so no further work action continues.",
    },
  };

  return map[locale][status];
}

export function getBookingNextStepLabel(
  locale: Locale,
  status: BookingStatus,
): string {
  const map: Record<Locale, Record<BookingStatus, string>> = {
    fil: {
      pending: "Susunod: hintayin ang pagtanggap ng tradesman",
      accepted: "Susunod: kumpirmahin ang oras o ayusin sa chat",
      "in-progress": "Susunod: markahan ang trabaho bilang tapos",
      completed: "Susunod: mag-iwan ng review",
      cancelled: "Susunod: gumawa ulit ng bagong booking kung kailangan",
    },
    en: {
      pending: "Next step: wait for the tradesman to accept",
      accepted: "Next step: confirm the visit time or coordinate in chat",
      "in-progress": "Next step: mark the work as complete",
      completed: "Next step: leave a review",
      cancelled: "Next step: create a new booking if needed",
    },
  };

  return map[locale][status];
}
