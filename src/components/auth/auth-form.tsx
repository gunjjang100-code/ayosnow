"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  googleEnabled: boolean;
  facebookEnabled: boolean;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "요청을 처리하지 못했습니다.";
}

export function AuthForm({ mode, googleEnabled, facebookEnabled }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "");
    const role = String(formData.get("role") ?? "customer");

    startTransition(async () => {
      try {
        if (mode === "signup") {
          const response = await fetch("/api/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullName,
              email,
              password,
              role,
            }),
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: unknown }
            | null;

          if (!response.ok) {
            throw new Error(getErrorMessage(payload?.error));
          }
        }

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        router.push(result?.url ?? callbackUrl);
        router.refresh();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    });
  }

  function handleOAuth(provider: "google" | "facebook") {
    void signIn(provider, { callbackUrl });
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="glass-card p-8">
        <span className="eyebrow-pill">AyosNow Account</span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          {mode === "signup" ? "AyosNow 가입하기" : "AyosNow 로그인"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Google, Facebook 또는 이메일로 가입할 수 있습니다. 전문가로 활동하려면 이메일 가입에서
          전문가 역할을 선택해 주세요.
        </p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            disabled={!googleEnabled}
            onClick={() => handleOAuth("google")}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Google로 계속하기
          </button>
          <button
            type="button"
            disabled={!facebookEnabled}
            onClick={() => handleOAuth("facebook")}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Facebook으로 계속하기
          </button>
          {(!googleEnabled || !facebookEnabled) ? (
            <p className="text-xs leading-5 text-amber-700">
              OAuth 버튼을 쓰려면 `.env`에 Google/Facebook Client ID와 Secret을 넣어야 합니다.
            </p>
          ) : null}
        </div>
      </section>

      <section className="panel-shell p-8">
        <form className="grid gap-4" onSubmit={handleEmailSubmit}>
          {mode === "signup" ? (
            <>
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                이름
                <input
                  name="fullName"
                  required
                  minLength={2}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
                  placeholder="Maria Cruz"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                가입 역할
                <select
                  name="role"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
                  defaultValue="customer"
                >
                  <option value="customer">고객으로 가입</option>
                  <option value="tradesman">전문가로 가입</option>
                </select>
              </label>
            </>
          ) : null}

          <label className="grid gap-2 text-sm font-bold text-slate-800">
            이메일
            <input
              name="email"
              required
              type="email"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-800">
            비밀번호
            <input
              name="password"
              required
              type="password"
              minLength={8}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-300"
              placeholder="8자 이상"
            />
          </label>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "처리 중..."
              : mode === "signup"
                ? "이메일로 가입하기"
                : "이메일로 로그인"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          {mode === "signup" ? "이미 계정이 있나요?" : "아직 계정이 없나요?"}{" "}
          <Link
            href={mode === "signup" ? "/login" : "/signup"}
            className="font-bold text-teal-700"
          >
            {mode === "signup" ? "로그인하기" : "가입하기"}
          </Link>
        </p>
      </section>
    </div>
  );
}
