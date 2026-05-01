import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { listNotificationsForUser } from "@/lib/notifications/service";

export async function GET(request: NextRequest) {
  // 가장 먼저 인증을 확인한다.
  // 인증이 없으면 아래 로직은 절대 실행하지 않는다.
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const notifications = await listNotificationsForUser(sessionUser.id);

  return NextResponse.json({
    notifications,
  });
}
