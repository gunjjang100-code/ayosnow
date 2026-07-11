import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { markNotificationAsRead } from "@/lib/notifications/service";
import { markNotificationReadSchema } from "@/lib/validations/notification";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
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
      { error: "You can only mark your own notifications as read." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    notification,
  });
}
