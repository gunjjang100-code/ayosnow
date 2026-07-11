import type { Locale } from "@/lib/types";

function getOffsetHours() {
  // English and Filipino public screens use Manila time.
  // A fixed offset keeps server and browser rendering consistent.
  return 8;
}

function toShiftedDate(locale: Locale, isoString: string) {
  const baseDate = new Date(isoString);
  return new Date(baseDate.getTime() + getOffsetHours() * 60 * 60 * 1000);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateTimeLabel(locale: Locale, isoString: string) {
  // Build the label manually so server and browser output stays identical.
  const date = toShiftedDate(locale, isoString);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour24 = date.getUTCHours();
  const minute = pad(date.getUTCMinutes());
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const period = hour24 >= 12 ? "PM" : "AM";
  return `${monthLabels[month - 1]} ${day}, ${hour12}:${minute} ${period}`;
}

export function toDateTimeLocalValueInZone(locale: Locale, isoString: string) {
  // datetime-local inputs need the "YYYY-MM-DDTHH:MM" format.
  // This avoids hydration differences between environments.
  const date = toShiftedDate(locale, isoString);
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
