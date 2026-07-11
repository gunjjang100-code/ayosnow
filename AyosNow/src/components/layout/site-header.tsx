import Image from "next/image";
import Link from "next/link";

import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { MobileHeaderMenu } from "@/components/layout/mobile-header-menu";
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
  const publicLocale = locale === "fil" ? "fil" : "en";
  const text = copy[publicLocale];
  const navigationConfig = getRoleNavigationConfig(publicLocale, role);
  const isSignedIn = currentSessionToken === "next-auth";
  const authLabels = { login: "Login", signup: "Sign up", logout: "Log out" };
  const publicNavigation =
    publicLocale === "en"
      ? [
          { label: "Home", href: "/" },
          { label: "How It Works", href: "/how-it-works" },
          { label: "Promotional Videos", href: "/promotional-videos" },
          { label: "Services", href: "/#services" },
          { label: "Professionals", href: "/#professionals" },
          { label: "About", href: "/#about" },
        ]
      : publicLocale === "fil"
        ? [
            { label: "Home", href: "/" },
            { label: "Paano Gumagana", href: "/how-it-works" },
            { label: "Mga Promotional Video", href: "/promotional-videos" },
            { label: "Services", href: "/#services" },
            { label: "Professionals", href: "/#professionals" },
            { label: "About", href: "/#about" },
          ]
        : [];
  const menuNavigation = isSignedIn
    ? navigationConfig.items.filter((item) => item.href !== "/settlements")
    : publicNavigation;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 shadow-[0_12px_36px_-34px_rgba(15,23,42,0.48)] backdrop-blur-2xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0 shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/puntago-logo-192.png"
              alt={text.siteName}
              width={192}
              height={192}
              priority
              unoptimized
              className="h-10 w-10 rounded-2xl object-contain sm:h-11 sm:w-11"
            />
            <span className="hidden text-lg font-black tracking-normal text-slate-950 min-[380px]:inline">
              PuntaGo
            </span>
            <span className="hidden shrink-0 items-center whitespace-nowrap rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800 min-[1780px]:inline-flex">
              {navigationConfig.roleBadgeLabel}
            </span>
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          className="hidden min-w-0 items-center justify-center gap-5 overflow-hidden min-[1780px]:flex"
        >
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative whitespace-nowrap text-sm font-black text-slate-800 transition after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-teal-600 after:transition-all hover:text-teal-700 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          {!isSignedIn ? (
            <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
              <Link
                href="/login"
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full border border-slate-200 px-3 text-xs font-black text-slate-800 shadow-sm transition duration-150 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.96] active:border-teal-500 active:bg-teal-100 active:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              >
                {authLabels.login}
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full bg-teal-700 px-3 text-xs font-black !text-white shadow-[0_12px_22px_-18px_rgba(15,118,110,0.8)] transition duration-150 hover:bg-teal-800 active:scale-[0.96] active:bg-teal-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              >
                {authLabels.signup}
              </Link>
            </div>
          ) : null}
          {role === "tradesman" ? (
            <Link
              href="/settlements"
              className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-900 transition hover:border-teal-300 hover:bg-teal-100 xl:inline-flex"
              title="Open professional credit balance and top-up page."
            >
              <span>{walletBalance ?? 0} PHP</span>
            </Link>
          ) : null}
          <Link
            href={navigationConfig.primaryAction.href}
            className="hidden shrink-0 items-center whitespace-nowrap rounded-full bg-teal-700 px-5 py-2.5 text-sm font-black !text-white shadow-[0_16px_28px_-20px_rgba(15,118,110,0.8)] transition hover:-translate-y-0.5 hover:bg-teal-800 hover:!text-white active:translate-y-0 active:scale-[0.97] focus-visible:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:inline-flex"
          >
            {navigationConfig.primaryAction.label}
          </Link>
          {!isSignedIn ? (
          <div className="hidden shrink-0 sm:block">
            <AuthHeaderActions isSignedIn={isSignedIn} locale={publicLocale} />
          </div>
          ) : null}
          {isSignedIn ? (
            <Link
              href="/profile"
              className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)] transition duration-150 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.96] active:border-teal-500 active:bg-teal-100 active:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 min-[520px]:px-4 min-[1780px]:hidden"
            >
              {navigationConfig.profileLabel}
            </Link>
          ) : null}
          {isSignedIn ? (
            <HeaderNotificationBell
              key={`${initialUnreadCount}:${initialNotifications[0]?.id ?? "empty"}`}
              locale={publicLocale}
              initialNotifications={initialNotifications}
              initialUnreadCount={initialUnreadCount}
              enabled={isSignedIn}
            />
          ) : null}

          <MobileHeaderMenu
            locale={publicLocale}
            isSignedIn={isSignedIn}
            languageLabel={text.languageLabel}
            navigationItems={menuNavigation}
            primaryAction={navigationConfig.primaryAction}
            profileLabel={navigationConfig.profileLabel}
            showCredit={role === "tradesman"}
            walletBalance={walletBalance}
          />
        </div>
      </div>
    </header>
  );
}
