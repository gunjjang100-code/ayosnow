"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale, UserRole } from "@/lib/types";

interface MobileBottomNavigationProps {
  locale: Locale;
  role: UserRole;
}

function getLabel(locale: Locale, labels: { fil: string; en: string }) {
  if (locale === "fil") {
    return labels.fil;
  }

  if (locale === "en") {
    return labels.en;
  }

  return labels.en;
}

export function MobileBottomNavigation({ locale, role }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const items =
    role === "tradesman"
      ? [
          {
            href: "/dashboard",
            shortLabel: "D",
            label: getLabel(locale, { fil: "Dashboard", en: "Dashboard" }),
          },
          {
            href: "/requests",
            shortLabel: "R",
            label: getLabel(locale, { fil: "Requests", en: "Requests" }),
          },
          {
            href: "/bookings",
            shortLabel: "B",
            label: getLabel(locale, { fil: "Booking", en: "Bookings" }),
          },
          {
            href: "/chat",
            shortLabel: "M",
            label: getLabel(locale, { fil: "Usapan", en: "Chat" }),
          },
          {
            href: "/settlements",
            shortLabel: "₱",
            label: getLabel(locale, { fil: "Credit", en: "Credits" }),
          },
        ]
      : role === "admin"
        ? [
            {
              href: "/admin",
              shortLabel: "A",
              label: getLabel(locale, { fil: "Admin", en: "Admin" }),
            },
            {
              href: "/admin/wallets",
              shortLabel: "₱",
              label: getLabel(locale, { fil: "Wallet", en: "Wallets" }),
            },
            {
              href: "/bookings",
              shortLabel: "B",
              label: getLabel(locale, { fil: "Booking", en: "Bookings" }),
            },
            {
              href: "/chat",
              shortLabel: "M",
              label: getLabel(locale, { fil: "Usapan", en: "Chat" }),
            },
            {
              href: "/profile",
              shortLabel: "P",
              label: getLabel(locale, { fil: "Profile", en: "Profile" }),
            },
          ]
        : [
            {
              href: "/",
              shortLabel: "H",
              label: getLabel(locale, { fil: "Home", en: "Home" }),
            },
            {
              href: "/quote-request",
              shortLabel: "+",
              label: getLabel(locale, { fil: "Request", en: "Request" }),
            },
            {
              href: "/quotes",
              shortLabel: "Q",
              label: getLabel(locale, { fil: "Quote", en: "Quotes" }),
            },
            {
              href: "/bookings",
              shortLabel: "B",
              label: getLabel(locale, { fil: "Booking", en: "Bookings" }),
            },
            {
              href: "/chat",
              shortLabel: "M",
              label: getLabel(locale, { fil: "Usapan", en: "Chat" }),
            },
          ];

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_36px_-30px_rgba(15,23,42,0.45)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={[
                "group relative flex min-h-14 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl text-center text-[11px] font-bold transition duration-150 ease-out",
                "active:translate-y-0.5 active:scale-[0.94] active:bg-teal-100 active:text-teal-950",
                "hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
                isActive
                  ? "bg-teal-50 text-teal-950 shadow-[inset_0_0_0_1px_rgba(20,184,166,0.28)]"
                  : "text-slate-700",
              ].join(" ")}
            >
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1 h-1 w-8 rounded-full bg-teal-600"
                />
              ) : null}
              <span
                aria-hidden="true"
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white transition duration-150 ease-out",
                  "group-active:scale-110 group-active:bg-teal-700 group-active:shadow-[0_8px_18px_-10px_rgba(15,118,110,0.85)]",
                  isActive
                    ? "bg-teal-700 shadow-[0_8px_18px_-12px_rgba(15,118,110,0.9)]"
                    : "bg-slate-950",
                ].join(" ")}
              >
                {item.shortLabel}
              </span>
              <span className="leading-3 transition duration-150 group-active:font-black">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
