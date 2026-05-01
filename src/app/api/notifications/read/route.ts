import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { markNotificationAsRead } from "@/lib/notifications/service";
import { markNotificationReadSchema } from "@/lib/validations/notification";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = markNotificationReadSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const notification = await markNotificationAsRead(
    sessionUser.id,
    parsed.data.notificationId,
  );

  if (!notification) {
    return NextResponse.json(
      { error: "내 알림만 읽음 처리할 수 있습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    notification,
  });
}
