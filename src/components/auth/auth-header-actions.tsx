"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface AuthHeaderActionsProps {
  isSignedIn: boolean;
}

export function AuthHeaderActions({ isSignedIn }: AuthHeaderActionsProps) {
  if (!isSignedIn) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/login"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold !text-white transition hover:bg-teal-800"
        >
          가입
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/login" })}
      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
    >
      로그아웃
    </button>
  );
}
