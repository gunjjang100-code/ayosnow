import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import "@/app/globals.css";
import { RoleSelectionRedirect } from "@/components/auth/role-selection-redirect";
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

export const metadata: Metadata = {
  title: "AyosNow",
  description: "필리핀 홈서비스 예약과 견적 비교 플랫폼",
  applicationName: "AyosNow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AyosNow",
  },
  other: {
    google: "notranslate",
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
  const sessionUser = await getOptionalSessionUser();
  let initialUnreadCount = 0;
  let initialNotifications: NotificationListItem[] = [];
  let walletBalance: number | null = null;

  try {
    [initialNotifications, initialUnreadCount] = await Promise.all([
      listNotificationsForUser(sessionUser.id, 12),
      countUnreadNotificationsForUser(sessionUser.id),
    ]);
  } catch {
    initialNotifications = [];
    initialUnreadCount = 0;
  }

  if (sessionUser.role === "tradesman") {
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
    <html lang={locale} translate="no" className="notranslate">
      <body className="notranslate">
        <RoleSelectionRedirect enabled={sessionUser.needsRoleSelection} />
        <SiteHeader
          locale={locale}
          role={sessionUser.role}
          currentSessionToken={sessionUser.token}
          initialNotifications={initialNotifications}
          initialUnreadCount={initialUnreadCount}
          walletBalance={walletBalance}
        />
        <main>{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
