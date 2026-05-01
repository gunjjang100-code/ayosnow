"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { copy } from "@/lib/i18n";
import type { NotificationListItem } from "@/lib/notifications/service";
import type { Locale } from "@/lib/types";

interface HeaderNotificationBellProps {
  locale: Locale;
  initialNotifications: NotificationListItem[];
  initialUnreadCount: number;
}

function formatTime(value: string, locale: Locale) {
  const language = locale === "ko" ? "ko-KR" : locale === "fil" ? "fil-PH" : "en-US";

  return new Intl.DateTimeFormat(language, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

async function playNotificationSound(audioContext: AudioContext | null) {
  if (!audioContext) {
    return;
  }

  try {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(1046, now + 0.08);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.26);
  } catch {
    // 소리 재생 실패가 알림 표시 자체를 막으면 안 된다.
  }
}

export function HeaderNotificationBell({
  locale,
  initialNotifications,
  initialUnreadCount,
}: HeaderNotificationBellProps) {
  const router = useRouter();
  const text = copy[locale];
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [feedback, setFeedback] = useState<string | null>(null);
  const unreadCountRef = useRef(initialUnreadCount);
  const firstNotificationIdRef = useRef(initialNotifications[0]?.id ?? null);
  const audioReadyRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mountedRef = useRef(false);

  const channelHints = useMemo(
    () => [
      text.notificationsInAppHint,
      text.notificationsEmailHint,
      text.notificationsPushHint,
      text.notificationsSmsHint,
    ],
    [text],
  );

  useEffect(() => {
    function unlockAudio() {
      if (audioReadyRef.current) {
        return;
      }

      try {
        const AudioContextClass =
          window.AudioContext ||
          // Safari용 예외 경로다.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext;

        if (!AudioContextClass) {
          return;
        }

        const context = new AudioContextClass();
        audioContextRef.current = context;
        audioReadyRef.current = true;

        if (context.state === "suspended") {
          void context.resume().catch(() => {
            // 브라우저 정책으로 막혀도 배지는 계속 동작한다.
          });
        }
      } catch {
        // 소리 준비 실패는 치명 오류가 아니므로 조용히 넘긴다.
      }
    }

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function refreshNotifications() {
      try {
        const [listResponse, countResponse] = await Promise.all([
          fetch("/api/notifications", { cache: "no-store" }),
          fetch("/api/notifications/unread-count", { cache: "no-store" }),
        ]);

        if (!listResponse.ok || !countResponse.ok) {
          return;
        }

        const listResult = (await listResponse.json()) as {
          notifications?: NotificationListItem[];
        };
        const countResult = (await countResponse.json()) as {
          unreadCount?: number;
        };

        const nextNotifications = listResult.notifications ?? [];
        const nextUnreadCount = countResult.unreadCount ?? 0;
        const previousUnreadCount = unreadCountRef.current;
        const previousFirstId = firstNotificationIdRef.current;
        const nextFirstId = nextNotifications[0]?.id ?? null;
        const hasNewUnread = nextUnreadCount > previousUnreadCount;
        const firstItemChanged = nextFirstId !== previousFirstId;

        if (!mountedRef.current) {
          return;
        }

        setNotifications(nextNotifications);
        setUnreadCount(nextUnreadCount);
        unreadCountRef.current = nextUnreadCount;
        firstNotificationIdRef.current = nextFirstId;

        if (hasNewUnread || (nextUnreadCount > 0 && firstItemChanged)) {
          void playNotificationSound(audioContextRef.current);
          router.refresh();
        }
      } catch {
        // 일시적인 네트워크 오류는 다음 폴링에서 다시 시도한다.
      }
    }

    const interval = window.setInterval(refreshNotifications, 5000);

    function handleFocusRefresh() {
      void refreshNotifications();
    }

    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleFocusRefresh);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleFocusRefresh);
    };
  }, [router]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as {
          notifications?: NotificationListItem[];
        };
        const nextNotifications = result.notifications ?? [];
        setNotifications(nextNotifications);
        firstNotificationIdRef.current = nextNotifications[0]?.id ?? null;
      } catch {
        // 알림창을 열 때 갱신이 실패해도 기존 목록은 유지한다.
      }
    })();
  }, [isOpen]);

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
    unreadCountRef.current = Math.max(0, unreadCountRef.current - 1);
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
      unreadCountRef.current = 0;
      setFeedback(text.notificationsAllReadDone);
      router.refresh();
    });
  }

  async function openDetails(notification: NotificationListItem) {
    if (!notification.isRead) {
      await markAsReadRequest(notification.id);
    }

    setIsOpen(false);
    router.push(notification.href);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)] transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="mr-2">🔔</span>
        {text.notificationsOpen}
        {unreadCount > 0 ? (
          <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_30px_60px_-28px_rgba(15,23,42,0.45)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-950">{text.dashboardNotificationTitle}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {text.dashboardNotificationDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReadAll}
              disabled={isPending || unreadCount === 0}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {text.notificationsMarkAllRead}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {channelHints.map((item) => (
              <span
                key={item}
                className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>

          {feedback ? <p className="mt-3 text-xs text-emerald-700">{feedback}</p> : null}

          <div className="mt-4 grid max-h-[28rem] gap-3 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                {text.notificationsEmpty}
              </div>
            ) : (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-2xl border p-4 ${
                    notification.isRead
                      ? "border-slate-200 bg-white"
                      : "border-teal-200 bg-teal-50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-950">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-400">
                        {formatTime(notification.createdAt, locale)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
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
        </div>
      ) : null}
    </div>
  );
}
