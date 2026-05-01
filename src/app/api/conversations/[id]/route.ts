import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { getConversationDetailForUser } from "@/lib/chat/service";
import type { Locale } from "@/lib/types";

function toLocale(value: string | null): Locale {
  if (value === "fil" || value === "en") {
    return value;
  }

  return "ko";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const locale = toLocale(request.nextUrl.searchParams.get("locale"));
  const conversation = await getConversationDetailForUser(id, sessionUser.id, {
    locale,
    role: sessionUser.role,
  });

  if (conversation === "forbidden") {
    return NextResponse.json(
      { error: "이 대화에 접근할 권한이 없습니다." },
      { status: 403 },
    );
  }

  if (!conversation) {
    return NextResponse.json({ error: "대화를 찾지 못했습니다." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    conversation,
  });
}
