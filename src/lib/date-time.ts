import type { Locale } from "@/lib/types";

function getOffsetHours(locale: Locale) {
  // 한국어 화면은 서울 기준, 필리핀어/영어 화면은 마닐라 기준으로 맞춘다.
  // 고정 숫자를 쓰는 이유는 서버와 브라우저가 같은 계산 결과를 내게 하려는 것이다.
  return locale === "ko" ? 9 : 8;
}

function toShiftedDate(locale: Locale, isoString: string) {
  const baseDate = new Date(isoString);
  return new Date(baseDate.getTime() + getOffsetHours(locale) * 60 * 60 * 1000);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateTimeLabel(locale: Locale, isoString: string) {
  // Intl의 오전/AM 표현은 실행 환경마다 다를 수 있다.
  // 그래서 여기서는 시간을 직접 조합해서 서버와 브라우저가 같은 문자열을 내도록 고정한다.
  const date = toShiftedDate(locale, isoString);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour24 = date.getUTCHours();
  const minute = pad(date.getUTCMinutes());
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  if (locale === "ko") {
    const period = hour24 >= 12 ? "오후" : "오전";
    return `${month}월 ${day}일 ${period} ${hour12}:${minute}`;
  }

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
  // datetime-local 입력창은 "YYYY-MM-DDTHH:MM" 형태를 원한다.
  // 여기서도 Intl을 쓰지 않고 직접 조합해서 하이드레이션 차이를 막는다.
  const date = toShiftedDate(locale, isoString);
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
