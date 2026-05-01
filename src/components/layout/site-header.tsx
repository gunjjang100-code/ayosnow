import Link from "next/link";

import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { HeaderNotificationBell } from "@/components/notifications/header-notification-bell";
import { copy } from "@/lib/i18n";
import type { NotificationListItem } from "@/lib/notifications/service";
import { getRoleNavigationConfig } from "@/lib/role-ui";
import type { Locale, UserRole } from "@/lib/types";

interface SiteHeaderProps {
  locale: Locale;
  role: UserRole;
  currentSessionToken: string;
  initialNotifications: NotificationListItem[];
  initialUnreadCount: number;
  walletBalance?: number | null;
}

export function SiteHeader({
  locale,
  role,
  currentSessionToken,
  initialNotifications,
  initialUnreadCount,
  walletBalance,
}: SiteHeaderProps) {
  const text = copy[locale];
  const navigationConfig = getRoleNavigationConfig(locale, role);
  const isSignedIn = currentSessionToken === "next-auth" || currentSessionToken.startsWith("demo-");

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0f766e_0%,#115e59_65%,#0f172a_100%)] text-base font-black text-white shadow-[0_16px_32px_-20px_rgba(15,23,42,0.65)]">
              <span>A</span>
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-300" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                {text.siteTagline}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-slate-950">{text.siteName}</p>
                <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                  {navigationConfig.roleBadgeLabel}
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <AuthHeaderActions isSignedIn={isSignedIn} />
          <HeaderNotificationBell
            key={`${initialUnreadCount}:${initialNotifications[0]?.id ?? "empty"}`}
            locale={locale}
            initialNotifications={initialNotifications}
            initialUnreadCount={initialUnreadCount}
          />
          {role === "tradesman" ? (
            <Link
              href="/settlements"
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900 transition hover:border-teal-300 hover:bg-teal-100"
              title="전문가 크레딧 잔액과 충전 화면으로 이동합니다."
            >
              <span className="text-xs uppercase tracking-[0.18em] text-teal-700">Credit</span>
              <span>{walletBalance ?? 0} PHP</span>
            </Link>
          ) : null}
          <LanguageSwitcher currentLocale={locale} label={text.languageLabel} />
          <Link
            href="/profile"
            className="hidden shrink-0 items-center whitespace-nowrap rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 2xl:inline-flex"
          >
            {navigationConfig.profileLabel}
          </Link>
          <Link
            href={navigationConfig.primaryAction.href}
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold !text-white shadow-[0_16px_28px_-20px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-slate-800 hover:!text-white focus-visible:!text-white"
          >
            {navigationConfig.primaryAction.label}
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-white/50">
        <div className="mx-auto flex max-w-7xl gap-2 px-4 py-3 sm:px-6 lg:px-8">
          {navigationConfig.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap break-keep rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.35)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

    </header>
  );
}
