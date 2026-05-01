"use client";

import type { ChangeEvent } from "react";

import { localeCookieName } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  label: string;
}

export function LanguageSwitcher({
  currentLocale,
  label,
}: LanguageSwitcherProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;

    // 언어 설정은 스위치처럼 기억되면 편하다.
    // 그래서 localStorage 대신 쿠키에 저장해 서버 화면도 같은 언어로 그리게 한다.
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <label className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
      <span className="hidden shrink-0 whitespace-nowrap sm:inline">{label}</span>
      <select
        value={currentLocale}
        onChange={handleChange}
        className="min-w-[5.5rem] bg-transparent text-sm font-semibold text-slate-800 outline-none"
        aria-label={label}
      >
        <option value="ko">한국어</option>
        <option value="fil">Filipino</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
