import { NextResponse, type NextRequest } from "next/server";

import { createNotification } from "@/lib/notifications/service";
import { getRequestSessionUser, isAdmin } from "@/lib/auth/session";
import { createNotificationSchema } from "@/lib/validations/notification";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // 이 API는 테스트용 수동 생성 API다.
  // 다른 사람에게 마음대로 알림을 보내면 안 되므로, 관리자만 허용한다.
  if (!isAdmin(sessionUser.role)) {
    return NextResponse.json(
      { error: "관리자만 알림을 수동 생성할 수 있습니다." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = createNotificationSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results = await createNotification({
    userId: parsed.data.targetUserId,
    type: parsed.data.type,
    title: parsed.data.title,
    message: parsed.data.message,
    relatedId: parsed.data.relatedId,
    relatedType: parsed.data.relatedType,
    channels: parsed.data.channels,
  });

  return NextResponse.json({
    ok: true,
    createdCount: results.length,
  });
}
