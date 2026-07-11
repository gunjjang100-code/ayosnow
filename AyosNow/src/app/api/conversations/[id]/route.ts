import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { getConversationDetailForUser } from "@/lib/chat/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await getConversationDetailForUser(id, sessionUser.id);

  if (conversation === "forbidden") {
    return NextResponse.json(
      { error: "You do not have permission to access this conversation." },
      { status: 403 },
    );
  }

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    conversation,
  });
}
