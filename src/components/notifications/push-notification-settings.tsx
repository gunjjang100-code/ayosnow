"use client";

import { useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/types";

interface PushNotificationSettingsProps {
  locale: Locale;
  vapidPublicKey: string | null;
}

function toUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(normalized);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationSettings({
  locale,
  vapidPublicKey,
}: PushNotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window === "undefined" || !("Notification" in window)
      ? "unsupported"
      : Notification.permission,
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const text = useMemo(() => {
    if (locale === "en") {
      return {
        title: "Browser push alerts",
        description:
          "Turn this on to receive quote and booking alerts quickly on this device.",
        mobileTitle: "To receive alerts on mobile",
        mobileIos:
          "On iPhone/iPad, open this site in Safari, add it to the Home Screen, launch it once from the Home Screen, and then turn on push alerts.",
        mobileAndroid:
          "On Android, open this site in Chrome, allow notifications, and if possible install it as an app for more stable alerts.",
        mobileNetwork:
          "Turn on alerts on each device where you want to receive updates.",
        unsupported: "This browser does not support web push notifications.",
        denied: "Push is blocked in this browser. Change browser notification settings first.",
        statusOn: "Push alerts are active on this device.",
        statusOff: "Push alerts are not active on this device yet.",
        enable: "Turn on push alerts",
        disable: "Turn off push alerts",
        successOn: "Push alerts were enabled on this device.",
        successOff: "Push alerts were turned off on this device.",
        error: "Push setup failed. Please try again.",
        missingKey: "Push alerts are being prepared.",
      };
    }

    if (locale === "fil") {
      return {
        title: "Browser push alerts",
        description:
          "I-on ito para mabilis mong makita ang quote at booking alerts sa device na ito.",
        mobileTitle: "Para makatanggap sa mobile",
        mobileIos:
          "Sa iPhone/iPad, buksan ang site na ito sa Safari, idagdag sa Home Screen, buksan ito mula roon nang isang beses, at saka i-on ang push alerts.",
        mobileAndroid:
          "Sa Android, buksan ang site na ito sa Chrome, payagan ang notifications, at kung maaari ay i-install bilang app para mas stable ang alerts.",
        mobileNetwork:
          "I-on ang alerts sa bawat device kung saan mo gustong makatanggap ng updates.",
        unsupported: "Hindi suportado ng browser na ito ang web push notifications.",
        denied: "Naka-block ang push sa browser na ito. Ayusin muna ang browser notification settings.",
        statusOn: "Aktibo ang push alerts sa device na ito.",
        statusOff: "Hindi pa naka-on ang push alerts sa device na ito.",
        enable: "I-on ang push alerts",
        disable: "I-off ang push alerts",
        successOn: "Na-enable ang push alerts sa device na ito.",
        successOff: "Na-off ang push alerts sa device na ito.",
        error: "Hindi naihanda ang push alerts. Pakisubukang muli.",
        missingKey: "Inihahanda pa ang push alerts.",
      };
    }

    return {
      title: "브라우저 푸시 알림",
      description: "이 기기에서 견적과 예약 알림을 더 빨리 받으려면 여기서 켜 주세요.",
      mobileTitle: "휴대폰에서 받으려면",
      mobileIos:
        "아이폰/아이패드는 Safari로 이 사이트를 연 뒤 홈 화면에 추가하고, 홈 화면에서 한 번 실행한 다음 푸시 알림을 켜 주세요.",
      mobileAndroid:
        "안드로이드는 Chrome에서 이 사이트를 연 뒤 알림을 허용하고, 가능하면 앱처럼 설치하면 더 안정적으로 받을 수 있습니다.",
      mobileNetwork:
        "알림을 받고 싶은 기기마다 알림을 켜 주세요.",
      unsupported: "이 브라우저는 웹 푸시 알림을 지원하지 않습니다.",
      denied: "이 브라우저에서 푸시가 차단돼 있습니다. 브라우저 알림 설정을 먼저 확인해 주세요.",
      statusOn: "이 기기에서 푸시 알림을 받고 있습니다.",
      statusOff: "이 기기에서는 아직 푸시 알림이 켜지지 않았습니다.",
      enable: "푸시 알림 켜기",
      disable: "푸시 알림 끄기",
      successOn: "이 기기에서 푸시 알림이 켜졌습니다.",
      successOff: "이 기기에서 푸시 알림을 껐습니다.",
      error: "푸시 알림 설정에 실패했습니다. 다시 시도해 주세요.",
      missingKey: "푸시 알림은 준비 중입니다.",
    };
  }, [locale]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubscriptionState() {
      if (!("serviceWorker" in navigator) || permission === "unsupported") {
        return;
      }

      try {
        const response = await fetch("/api/push-subscriptions", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as { subscribed?: boolean };

        if (!cancelled) {
          setSubscribed(Boolean(result.subscribed));
        }
      } catch {
        // 상태 조회 실패는 화면 전체를 깨지 않게 조용히 넘긴다.
      }
    }

    void loadSubscriptionState();

    return () => {
      cancelled = true;
    };
  }, [permission]);

  async function enablePush() {
    if (!vapidPublicKey) {
      setFeedback(text.missingKey);
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setLoading(false);
        return;
      }

      await navigator.serviceWorker.register("/push-sw.js");
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toUint8Array(vapidPublicKey),
        }));

      const json = subscription.toJSON();

      await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
          },
        }),
      });

      setSubscribed(true);
      setFeedback(text.successOn);
    } catch {
      setFeedback(text.error);
    } finally {
      setLoading(false);
    }
  }

  async function disablePush() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push-subscriptions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        await subscription.unsubscribe();
      }

      setSubscribed(false);
      setFeedback(text.successOff);
    } catch {
      setFeedback(text.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="soft-card p-5">
      <p className="text-lg font-bold text-slate-950">{text.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text.description}</p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {permission === "unsupported"
          ? text.unsupported
          : permission === "denied"
            ? text.denied
            : subscribed
              ? text.statusOn
              : text.statusOff}
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
        <p className="font-semibold text-slate-950">{text.mobileTitle}</p>
        <p className="mt-2">{text.mobileIos}</p>
        <p className="mt-2">{text.mobileAndroid}</p>
        <p className="mt-2 text-amber-800">{text.mobileNetwork}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void enablePush()}
          disabled={loading || !vapidPublicKey || permission === "unsupported" || subscribed}
          className="rounded-full border border-teal-300 px-4 py-2 text-sm font-semibold text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {text.enable}
        </button>
        <button
          type="button"
          onClick={() => void disablePush()}
          disabled={loading || permission === "unsupported" || !subscribed}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {text.disable}
        </button>
      </div>

      {feedback ? (
        <p className="mt-3 text-sm font-medium text-teal-700">{feedback}</p>
      ) : null}
    </article>
  );
}
