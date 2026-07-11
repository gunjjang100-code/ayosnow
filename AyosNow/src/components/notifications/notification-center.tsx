"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { copy } from "@/lib/i18n";
import type { NotificationListItem } from "@/lib/notifications/service";
import type { Locale } from "@/lib/types";

interface NotificationCenterProps {
  locale: Locale;
  initialNotifications: NotificationListItem[];
  initialUnreadCount: number;
}

function formatTime(value: string, locale: Locale) {
  const language = locale === "fil" ? "fil-PH" : "en-US";

  return new Intl.DateTimeFormat(language, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationCenter({
  locale,
  initialNotifications,
  initialUnreadCount,
}: NotificationCenterProps) {
  const router = useRouter();
  const text = copy[locale];
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [feedback, setFeedback] = useState<string | null>(null);

  const channelHints = useMemo(
    () => [
      text.notificationsInAppHint,
      text.notificationsEmailHint,
      text.notificationsPushHint,
      text.notificationsSmsHint,
    ],
    [text],
  );

  async function markAsReadRequest(notificationId: string) {
    const response = await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationId }),
    });

    if (!response.ok) {
      return false;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
    setFeedback(text.notificationsReadDone);
    router.refresh();

    return true;
  }

  async function handleRead(notificationId: string) {
    startTransition(async () => {
      await markAsReadRequest(notificationId);
    });
  }

  async function handleReadAll() {
    startTransition(async () => {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
      setFeedback(text.notificationsAllReadDone);
      router.refresh();
    });
  }

  async function openDetails(notification: NotificationListItem) {
    if (!notification.isRead) {
      await markAsReadRequest(notification.id);
    }

    router.push(notification.href);
  }

  return (
    <section className="panel-shell p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-teal-700">{text.dashboardNotificationTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {text.dashboardNotificationDescription}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {channelHints.map((item) => (
              <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="relative rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)]"
          >
            <span className="mr-2">🔔</span>
            {text.notificationsOpen}
            {unreadCount > 0 ? (
              <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={handleReadAll}
            disabled={isPending || unreadCount === 0}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {text.notificationsMarkAllRead}
          </button>
        </div>
      </div>

      {feedback ? <p className="mt-3 text-sm text-emerald-700">{feedback}</p> : null}

      {isOpen ? (
        <div className="mt-5 grid gap-3">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              {text.notificationsEmpty}
            </div>
          ) : (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-2xl border p-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.35)] ${
                  notification.isRead
                    ? "border-slate-200 bg-white"
                    : "border-teal-200 bg-teal-50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-950">{notification.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {formatTime(notification.createdAt, locale)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!notification.isRead ? (
                      <button
                        type="button"
                        onClick={() => handleRead(notification.id)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {text.notificationsMarkRead}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void openDetails(notification)}
                      className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white"
                    >
                      {text.notificationsSeeDetails}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
