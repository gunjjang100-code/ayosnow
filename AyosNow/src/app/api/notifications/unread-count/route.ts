import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { countUnreadNotificationsForUser } from "@/lib/notifications/service";

export async function GET(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const unreadCount = await countUnreadNotificationsForUser(sessionUser.id);

  return NextResponse.json({
    unreadCount,
  });
}
