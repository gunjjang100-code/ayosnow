import { getBookingStatusLabel, bookingStatusStyleMap } from "@/lib/constants/site";
import type { BookingStatus, Locale } from "@/lib/types";

interface StatusBadgeProps {
  status: BookingStatus;
  locale: Locale;
}

export function StatusBadge({ status, locale }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${bookingStatusStyleMap[status]}`}
    >
      {getBookingStatusLabel(locale, status)}
    </span>
  );
}
