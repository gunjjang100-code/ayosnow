import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import "@/app/globals.css";
import { RoleSelectionRedirect } from "@/components/auth/role-selection-redirect";
import { MobileBottomNavigation } from "@/components/layout/mobile-bottom-navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  countUnreadNotificationsForUser,
  listNotificationsForUser,
  type NotificationListItem,
} from "@/lib/notifications/service";
import { getWalletSnapshotForUser } from "@/lib/wallets/wallet-service";
import { appUrl, brandPositioning } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: brandPositioning.defaultTitle,
    template: "%s | PuntaGo",
  },
  description: brandPositioning.defaultDescription,
  applicationName: "PuntaGo",
  keywords: [
    "PuntaGo",
    "Pangasinan local services",
    "trusted local professionals Philippines",
    "Pangasinan professionals",
    "electrician in Pangasinan",
    "plumber in Pangasinan",
    "cleaning services in Pangasinan",
    "aircon repair in Pangasinan",
    "private chef in Pangasinan",
    "Philippines local service platform",
    "aircon cleaning",
    "plumbing",
    "electrical",
    "home repair",
    "fair quotations",
  ],
  alternates: {
    canonical: appUrl,
  },
  openGraph: {
    title: brandPositioning.defaultTitle,
    description: brandPositioning.defaultDescription,
    url: appUrl,
    siteName: "PuntaGo",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: brandPositioning.defaultTitle,
    description: brandPositioning.defaultDescription,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PuntaGo",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getCurrentLocale();
  const publicLocale = locale === "fil" ? "fil" : "en";
  const sessionUser = await getOptionalSessionUser();
  let initialUnreadCount = 0;
  let initialNotifications: NotificationListItem[] = [];
  let walletBalance: number | null = null;

  if (sessionUser.token) {
    try {
      [initialNotifications, initialUnreadCount] = await Promise.all([
        listNotificationsForUser(sessionUser.id, 12),
        countUnreadNotificationsForUser(sessionUser.id),
      ]);
    } catch {
      initialNotifications = [];
      initialUnreadCount = 0;
    }
  }

  if (sessionUser.token && sessionUser.role === "tradesman") {
    try {
      // 전문가 크레딧은 견적 제출 수수료와 바로 연결된다.
      // 그래서 정산 화면에 들어가지 않아도 헤더에서 항상 확인할 수 있게 내려준다.
      const walletSnapshot = await getWalletSnapshotForUser(sessionUser.id);
      walletBalance = walletSnapshot.balance;
    } catch {
      walletBalance = null;
    }
  }

  return (
    <html lang={publicLocale}>
      <body>
        <RoleSelectionRedirect enabled={sessionUser.needsRoleSelection} />
        <SiteHeader
          locale={publicLocale}
          role={sessionUser.role}
          currentSessionToken={sessionUser.token}
          initialNotifications={initialNotifications}
          initialUnreadCount={initialUnreadCount}
          walletBalance={walletBalance}
        />
        <main>{children}</main>
        <MobileBottomNavigation locale={publicLocale} role={sessionUser.role} />
        <SiteFooter locale={publicLocale} />
      </body>
    </html>
  );
}
