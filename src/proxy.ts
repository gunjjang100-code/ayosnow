import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { isSameOriginMutationRequest } from "@/lib/auth/csrf";

const csrfExemptApiPrefixes = [
  "/api/auth",
  "/api/paymongo/webhook",
];

const roleSelectionAllowedApiPrefixes = [
  "/api/auth",
  "/api/account/role",
];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (
    token?.needsRoleSelection &&
    !roleSelectionAllowedApiPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.json(
      { error: "가입 역할을 먼저 선택해 주세요." },
      { status: 403 },
    );
  }

  if (csrfExemptApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (!isSameOriginMutationRequest(request)) {
    return NextResponse.json(
      {
        error:
          "보안 확인에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
      },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
