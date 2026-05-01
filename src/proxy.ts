import { NextResponse, type NextRequest } from "next/server";

import { isSameOriginMutationRequest } from "@/lib/auth/csrf";

const csrfExemptApiPrefixes = [
  "/api/auth",
  "/api/paymongo/webhook",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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
