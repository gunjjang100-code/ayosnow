import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { markAllNotificationsAsRead } from "@/lib/notifications/service";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const updatedCount = await markAllNotificationsAsRead(sessionUser.id);

  return NextResponse.json({
    ok: true,
    updatedCount,
  });
}
