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
  "/api/bookings/instant",
  "/api/quotes/select",
];

export async function middleware(request: NextRequest) {
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
      { error: "Please choose your account role first." },
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
          "Security verification failed. Please refresh the page and try again.",
      },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
