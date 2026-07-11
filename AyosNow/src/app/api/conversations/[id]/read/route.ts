import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { markConversationAsReadForUser } from "@/lib/chat/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { id } = await params;
  const result = await markConversationAsReadForUser(id, sessionUser.id);

  if (result === "forbidden") {
    return NextResponse.json(
      { error: "You do not have permission to mark this conversation as read." },
      { status: 403 },
    );
  }

  if (result === null) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    updatedCount: result,
  });
}
