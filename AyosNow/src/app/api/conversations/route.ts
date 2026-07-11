import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { listConversationFeedForUser } from "@/lib/chat/service";
import type { Locale } from "@/lib/types";

function toLocale(value: string | null): Locale {
  if (value === "fil" || value === "en") {
    return value;
  }

  return "en";
}

export async function GET(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const locale = toLocale(request.nextUrl.searchParams.get("locale"));
  const result = await listConversationFeedForUser({
    userId: sessionUser.id,
    locale,
  });

  return NextResponse.json({
    ok: true,
    source: result.source,
    conversations: result.conversations,
  });
}
