import { NextResponse } from "next/server";

import {
  defaultDemoSessionToken,
  sessionCookieName,
} from "@/lib/auth/session-constants";
import { verifySession } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_AUTH !== "true") {
    return NextResponse.json(
      { error: "운영 환경에서는 데모 로그인을 사용할 수 없습니다." },
      { status: 404 },
    );
  }

  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token ?? defaultDemoSessionToken;

  const sessionUser = await verifySession(token);
  if (!sessionUser) {
    return NextResponse.json(
      { error: "유효한 데모 세션이 아닙니다." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    sessionUser,
  });

  response.cookies.set(sessionCookieName, token, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
