import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { updateTypingIndicatorForUser } from "@/lib/chat/service";
import { updateTypingIndicatorSchema } from "@/lib/validations/chat";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = updateTypingIndicatorSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const result = await updateTypingIndicatorForUser({
    conversationId: id,
    userId: sessionUser.id,
    isTyping: parsed.data.isTyping,
  });

  if (result === "forbidden") {
    return NextResponse.json(
      { error: "You do not have permission to send typing status in this conversation." },
      { status: 403 },
    );
  }

  if (!result) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
