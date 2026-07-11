"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import Link from "next/link";

import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { Locale } from "@/lib/types";

type MobileNavItem = {
  label: string;
  href: string;
};

interface MobileHeaderMenuProps {
  locale: Locale;
  isSignedIn: boolean;
  languageLabel: string;
  navigationItems: MobileNavItem[];
  primaryAction: MobileNavItem;
  profileLabel: string;
  showCredit: boolean;
  walletBalance?: number | null;
}

export function MobileHeaderMenu({
  locale,
  isSignedIn,
  languageLabel,
  navigationItems,
  primaryAction,
  profileLabel,
  showCredit,
  walletBalance,
}: MobileHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleMenuLinkClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    setIsOpen(false);

    // 같은 홈페이지 안의 섹션 이동은 메뉴를 닫은 뒤 직접 스크롤한다.
    // 이렇게 해야 사용자가 "눌렀는데 화면이 안 움직인다"고 느끼지 않는다.
    if (href.startsWith("/#") && window.location.pathname === "/") {
      event.preventDefault();
      const targetId = href.slice(2);
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", href);
      }
    }

    if (href === "/" && window.location.pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)] transition duration-150 hover:border-teal-300 hover:bg-teal-50 active:scale-[0.94] active:border-teal-500 active:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <span className="grid gap-1.5">
          <span className="block h-0.5 w-5 rounded-full bg-slate-950" />
          <span className="block h-0.5 w-5 rounded-full bg-slate-950" />
          <span className="block h-0.5 w-5 rounded-full bg-slate-950" />
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-14 z-50 max-h-[calc(100dvh-5rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_30px_80px_-38px_rgba(15,23,42,0.5)]">
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => handleMenuLinkClick(event, item.href)}
                className="rounded-2xl px-4 py-3 text-base font-black text-slate-900 transition duration-150 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.98] active:bg-teal-100 active:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4">
            {isSignedIn ? (
              <AuthHeaderActions isSignedIn={isSignedIn} locale={locale} />
            ) : null}
            <LanguageSwitcher
              currentLocale={locale}
              label={languageLabel}
              showLabelOnMobile
            />
            {showCredit ? (
              <Link
                href="/settlements"
                onClick={(event) => handleMenuLinkClick(event, "/settlements")}
                className="inline-flex min-h-12 items-center justify-between rounded-2xl border border-teal-200 bg-teal-50 px-4 text-sm font-bold text-teal-900 transition duration-150 hover:border-teal-300 hover:bg-teal-100 active:scale-[0.98] active:border-teal-500 active:bg-teal-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              >
                <span>Credit</span>
                <span>{walletBalance ?? 0} PHP</span>
              </Link>
            ) : null}
            <Link
              href="/profile"
              onClick={(event) => handleMenuLinkClick(event, "/profile")}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition duration-150 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.98] active:border-teal-500 active:bg-teal-100 active:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            >
              {profileLabel}
            </Link>
            <Link
              href={primaryAction.href}
              onClick={(event) => handleMenuLinkClick(event, primaryAction.href)}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-teal-700 px-5 py-3 text-sm font-black !text-white shadow-[0_18px_30px_-22px_rgba(15,118,110,0.85)] transition duration-150 hover:bg-teal-800 active:scale-[0.98] active:bg-teal-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            >
              {primaryAction.label}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
