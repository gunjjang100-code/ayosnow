import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";

import { sessionCookieName } from "@/lib/auth/session-constants";
import { authOptions } from "@/lib/auth/next-auth";
import { demoSessions, findDemoSessionByToken } from "@/lib/demo/demo-data";
import type { UserRole } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
}

export function isDemoSessionToken(token: string | undefined) {
  return Boolean(token && token.startsWith("demo-"));
}

export function isDemoAuthEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_AUTH === "true";
}

export function isDemoSessionUser(user: Pick<SessionUser, "token">) {
  return isDemoSessionToken(user.token);
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }

  if (!isDemoAuthEnabled() && isDemoSessionToken(token)) {
    return null;
  }

  try {
    const sessionUser = await findDemoSessionByToken(token);
    if (sessionUser) {
      return {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        role: sessionUser.role,
        token: sessionUser.token,
      };
    }
  } catch {
    // DB가 꺼져 있으면 demo-data 준비 과정에서 Prisma 에러가 먼저 난다.
    // 이때는 데모 계정 목록만으로 "읽기 전용 세션"을 만들어 화면 진입을 살린다.
  }

  const fallbackSession = demoSessions.find((session) => session.token === token);

  if (!fallbackSession) {
    return null;
  }

  return {
    // DB가 없을 때는 임시 식별자를 써서 화면만 먼저 살린다.
    id: `demo-${fallbackSession.token}`,
    email: fallbackSession.email,
    name: fallbackSession.fullName,
    role: fallbackSession.role,
    token: fallbackSession.token,
  };
}

export async function verifyStrictSession(
  token: string | undefined,
): Promise<SessionUser | null> {
  // API는 "쿠키가 없으면 기본 데모 계정으로 들어간다" 같은 완충 동작을 하면 안 된다.
  // 그래서 엄격 모드에서는 토큰이 아예 없으면 바로 실패시키고,
  // 토큰이 있을 때만 기존 검증 로직을 태운다.
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
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  return verifySession(token);
}

export async function getIsCurrentSessionDemo() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  return isDemoSessionToken(token);
}

export async function getDemoSessionUser(): Promise<SessionUser> {
  // 이 함수 이름은 예전 데모 단계 이름을 유지하고 있지만,
  // 지금 운영형 화면에서는 쿠키가 없을 때 자동으로 데모 고객을 넣지 않는다.
  // 비로그인 방문자는 "읽기 전용 손님"으로만 렌더링하고, 실제 저장 API는 계속 401로 막는다.
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
    };
  }

  const token = request.cookies.get(sessionCookieName)?.value;
  return verifyStrictSession(token);
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}
