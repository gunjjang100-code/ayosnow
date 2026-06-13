import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";

import { sessionCookieName } from "@/lib/auth/session-constants";
import { authOptions } from "@/lib/auth/next-auth";
import type { UserRole } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
  needsRoleSelection: boolean;
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }

  // 현재 운영형 로그인은 NextAuth 세션을 기준으로 동작합니다.
  // 사용자가 임의로 만든 session 쿠키는 신뢰하지 않습니다.
  return null;
}

export async function verifyStrictSession(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }

  return verifySession(token);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user?.id && nextAuthSession.user.email) {
    return {
      id: nextAuthSession.user.id,
      email: nextAuthSession.user.email,
      name: nextAuthSession.user.name ?? nextAuthSession.user.email,
      role: nextAuthSession.user.role,
      token: "next-auth",
      needsRoleSelection: nextAuthSession.user.needsRoleSelection ?? false,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  return verifySession(token);
}

export async function getOptionalSessionUser(): Promise<SessionUser> {
  // 비로그인 방문자는 읽기 전용 손님으로 렌더링합니다.
  // 저장/수정 API는 getRequestSessionUser()에서 다시 인증하므로 401로 막힙니다.
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    return sessionUser;
  }

  return {
    id: "guest",
    email: "guest@ayosnow.local",
    name: "Guest",
    role: "customer",
    token: "",
    needsRoleSelection: false,
  };
}

export async function getRequestSessionUser(
  request: NextRequest,
): Promise<SessionUser | null> {
  const nextAuthToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (nextAuthToken?.sub && nextAuthToken.email) {
    return {
      id: nextAuthToken.sub,
      email: nextAuthToken.email,
      name: nextAuthToken.name ?? nextAuthToken.email,
      role: (nextAuthToken.role as UserRole | undefined) ?? "customer",
      token: "next-auth",
      needsRoleSelection: nextAuthToken.needsRoleSelection ?? false,
    };
  }

  const token = request.cookies.get(sessionCookieName)?.value;
  return verifyStrictSession(token);
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}
