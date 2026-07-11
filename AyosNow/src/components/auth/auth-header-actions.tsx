"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/lib/types";

interface AuthHeaderActionsProps {
  isSignedIn: boolean;
  locale: Locale;
}

export function AuthHeaderActions({ isSignedIn, locale }: AuthHeaderActionsProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";
  const labels =
    locale === "en"
      ? { login: "Login", signup: "Sign up", logout: "Log out" }
      : locale === "fil"
        ? { login: "Log in", signup: "Sign up", logout: "Log out" }
        : { login: "Login", signup: "Sign up", logout: "Log out" };

  if (!isSignedIn) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/login"
          className={
            isLoginPage
              ? "inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-teal-700 px-4 py-2 text-sm font-bold !text-white shadow-[0_14px_24px_-18px_rgba(15,118,110,0.8)] transition duration-150 hover:bg-teal-800 active:scale-[0.97] active:bg-teal-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              : "inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition duration-150 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.97] active:border-teal-500 active:bg-teal-100 active:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          }
          aria-current={isLoginPage ? "page" : undefined}
        >
          {labels.login}
        </Link>
        <Link
          href="/signup"
          className={
            isSignupPage
              ? "inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-teal-700 px-4 py-2 text-sm font-bold !text-white shadow-[0_14px_24px_-18px_rgba(15,118,110,0.8)] transition duration-150 hover:bg-teal-800 active:scale-[0.97] active:bg-teal-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              : "inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition duration-150 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.97] active:border-teal-500 active:bg-teal-100 active:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          }
          aria-current={isSignupPage ? "page" : undefined}
        >
          {labels.signup}
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/login" })}
      className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition duration-150 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.97] active:border-teal-500 active:bg-teal-100 active:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
    >
      {labels.logout}
    </button>
  );
}
