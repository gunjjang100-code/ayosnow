"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import type { UserRole } from "@/lib/types";

type SelectableRole = Exclude<UserRole, "admin">;

function getSafeCallbackUrl(value: string | null, selectedRole: SelectableRole) {
  const fallback = selectedRole === "tradesman" ? "/dashboard" : "/";

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value === "/choose-role") {
    return fallback;
  }

  return value;
}

export function RoleSelectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<SelectableRole>("customer");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitRole() {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/account/role", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: selectedRole }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: unknown }
          | null;

        if (!response.ok) {
          const message =
            typeof payload?.error === "string"
              ? payload.error
              : "가입 역할을 저장하지 못했습니다.";
          throw new Error(message);
        }

        const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"), selectedRole);
        router.push(callbackUrl);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "가입 역할을 저장하지 못했습니다.");
      }
    });
  }

  return (
    <section className="panel-shell p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setSelectedRole("customer")}
          className={`rounded-[2rem] border p-5 text-left transition ${
            selectedRole === "customer"
              ? "border-teal-300 bg-teal-50 shadow-[0_18px_34px_-26px_rgba(15,118,110,0.6)]"
              : "border-slate-200 bg-white hover:border-teal-200"
          }`}
        >
          <span className="eyebrow-pill">고객</span>
          <h2 className="mt-4 text-2xl font-black text-slate-950">서비스를 요청할게요</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            청소, 수리, 이사 같은 홈서비스를 찾고 견적을 받아 예약할 수 있습니다.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole("tradesman")}
          className={`rounded-[2rem] border p-5 text-left transition ${
            selectedRole === "tradesman"
              ? "border-teal-300 bg-teal-50 shadow-[0_18px_34px_-26px_rgba(15,118,110,0.6)]"
              : "border-slate-200 bg-white hover:border-teal-200"
          }`}
        >
          <span className="eyebrow-pill">전문가</span>
          <h2 className="mt-4 text-2xl font-black text-slate-950">서비스를 제공할게요</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            받은 요청에 견적을 보내고, 내 서비스와 가능 시간을 관리할 수 있습니다.
          </p>
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={submitRole}
        disabled={isPending}
        className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? "저장 중..." : "선택 완료"}
      </button>
    </section>
  );
}
