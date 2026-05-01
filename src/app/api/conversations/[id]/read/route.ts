import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { markConversationAsReadForUser } from "@/lib/chat/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const result = await markConversationAsReadForUser(id, sessionUser.id);

  if (result === "forbidden") {
    return NextResponse.json(
      { error: "이 대화를 읽음 처리할 권한이 없습니다." },
      { status: 403 },
    );
  }

  if (result === null) {
    return NextResponse.json({ error: "대화를 찾지 못했습니다." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    updatedCount: result,
  });
}
