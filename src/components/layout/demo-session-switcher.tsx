"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { defaultDemoSessionToken } from "@/lib/auth/session-constants";
import { copy } from "@/lib/i18n";
import { getRoleHomePathForSessionToken } from "@/lib/role-ui";
import type { Locale } from "@/lib/types";

interface DemoSessionSwitcherProps {
  locale: Locale;
  currentSessionToken: string;
}

const demoOptions = [
  { value: "demo-customer", labelKey: "sessionCustomerLabel" },
  { value: "demo-tradesman-jose", labelKey: "sessionTradesmanJoseLabel" },
  { value: "demo-tradesman-miguel", labelKey: "sessionTradesmanMiguelLabel" },
  { value: "demo-tradesman-carlo", labelKey: "sessionTradesmanCarloLabel" },
  { value: "demo-admin", labelKey: "sessionAdminLabel" },
] as const;

export function DemoSessionSwitcher({
  locale,
  currentSessionToken,
}: DemoSessionSwitcherProps) {
  const router = useRouter();
  const text = copy[locale];
  const [selectedToken, setSelectedToken] = useState(currentSessionToken);
  const [isPending, startTransition] = useTransition();
  const displayedToken = isPending
    ? selectedToken
    : currentSessionToken || defaultDemoSessionToken;

  useEffect(() => {
    // 첫 방문자는 아직 세션 쿠키가 없을 수 있다.
    // 쿠키는 보안을 위해 httpOnly로 숨겼으므로 브라우저에서 직접 읽지 않는다.
    // 대신 서버가 내려준 currentSessionToken 값이 비어 있을 때만 기본 데모 세션을 만든다.
    if (!currentSessionToken) {
      void fetch("/api/demo-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: defaultDemoSessionToken }),
      });
    }
  }, [currentSessionToken]);

  function handleChange(nextToken: string) {
    setSelectedToken(nextToken);

    startTransition(async () => {
      await fetch("/api/demo-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: nextToken }),
      });

      // 데모 계정을 바꾸면 역할에 맞는 첫 화면으로 바로 보내 준다.
      // 이렇게 해야 "전문가로 바꿨는데도 고객 홈이 먼저 보이는" 어색함을 줄일 수 있다.
      router.push(getRoleHomePathForSessionToken(nextToken));
      router.refresh();
    });
  }

  return (
    <label className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <span className="hidden shrink-0 whitespace-nowrap font-semibold text-slate-600 xl:inline">
        {text.sessionSwitcherLabel}
      </span>
      <select
        value={displayedToken}
        onChange={(event) => handleChange(event.target.value)}
        className="min-w-[7.5rem] bg-transparent text-sm font-semibold text-slate-800 outline-none"
      >
        {demoOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {text[option.labelKey]}
          </option>
        ))}
      </select>
      {isPending ? (
        <span className="hidden shrink-0 whitespace-nowrap text-xs text-slate-500 md:inline">
          {text.sessionSwitchingMessage}
        </span>
      ) : null}
    </label>
  );
}
