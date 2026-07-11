export function formatPhp(amount: number) {
  return `PHP ${Math.round(amount).toLocaleString("en-PH")}`;
}

export function formatAdminDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  // 서버와 브라우저가 날짜를 서로 다르게 표현하면 hydration 오류가 난다.
  // 그래서 Intl의 자동 포맷에 맡기지 않고, 같은 규칙으로 직접 문자열을 만든다.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour24 = Number(getPart("hour"));
  const minute = getPart("minute");
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${year}. ${month}. ${day}. ${period} ${String(hour12).padStart(2, "0")}:${minute}`;
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}
