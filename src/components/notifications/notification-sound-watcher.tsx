"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface NotificationSoundWatcherProps {
  initialUnreadCount: number;
}

export function NotificationSoundWatcher({
  initialUnreadCount,
}: NotificationSoundWatcherProps) {
  const router = useRouter();
  const unreadCountRef = useRef(initialUnreadCount);
  const audioReadyRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    unreadCountRef.current = initialUnreadCount;
  }, [initialUnreadCount]);

  useEffect(() => {
    // 브라우저는 사용자가 한 번 클릭하거나 키를 눌러야
    // 소리를 허용하는 경우가 많다.
    // 그래서 첫 상호작용 때 오디오 컨텍스트를 준비해 둔다.
    function unlockAudio() {
      if (audioReadyRef.current) {
        return;
      }

      try {
        const AudioContextClass =
          window.AudioContext ||
          // Safari 호환용이다.
          // 타입이 기본 정의에 없어서 명시적으로 접근한다.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext;

        if (!AudioContextClass) {
          return;
        }

        const context = new AudioContextClass();
        audioContextRef.current = context;
        audioReadyRef.current = true;

        // Safari/macOS 계열은 컨텍스트를 만든 직후에도
        // suspended 상태로 남아 있을 수 있다.
        // 이 경우 실제 알림이 와도 소리가 안 나기 때문에
        // 첫 사용자 상호작용 시점에 한 번 깨워 둔다.
        if (context.state === "suspended") {
          void context.resume().catch(() => {
            // resume 실패는 치명 오류가 아니므로 조용히 넘긴다.
          });
        }
      } catch {
        // 소리 준비가 안 돼도 알림 자체는 계속 동작해야 한다.
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

    async function pollUnreadCount() {
      try {
        const response = await fetch("/api/notifications/unread-count", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as { unreadCount?: number };
        const nextUnreadCount = result.unreadCount ?? 0;
        const previousUnreadCount = unreadCountRef.current;

        if (mountedRef.current && nextUnreadCount > previousUnreadCount) {
          void playNotificationSound(audioContextRef.current);
          router.refresh();
        }

        unreadCountRef.current = nextUnreadCount;
      } catch {
        // 네트워크나 일시적인 서버 오류가 나도 알림 감시 자체는 계속 유지한다.
      }
    }

    const interval = window.setInterval(pollUnreadCount, 10000);

    function handleFocus() {
      void pollUnreadCount();
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [router]);

  return null;
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
    // 소리 재생이 막혀도 페이지 동작까지 멈추면 안 된다.
  }
}
