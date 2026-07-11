"use client";

import type { ChangeEvent } from "react";

import { localeCookieName } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  label: string;
  showLabelOnMobile?: boolean;
}

export function LanguageSwitcher({
  currentLocale,
  label,
  showLabelOnMobile = false,
}: LanguageSwitcherProps) {
  const safeLocale = currentLocale === "fil" ? "fil" : "en";

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.target.value;
    const nextLocale = selectedValue === "fil" ? "fil" : "en";

    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <label className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
      <span className={`${showLabelOnMobile ? "inline" : "hidden 2xl:inline"} shrink-0 whitespace-nowrap`}>
        {label}
      </span>
      <select
        value={safeLocale}
        onChange={handleChange}
        className="min-w-[5.5rem] bg-transparent text-sm font-semibold text-slate-800 outline-none"
        aria-label={label}
      >
        <option value="en">English</option>
        <option value="fil">Filipino</option>
      </select>
    </label>
  );
}
