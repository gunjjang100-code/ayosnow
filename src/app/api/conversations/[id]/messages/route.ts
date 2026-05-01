import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { sendMessageToConversation } from "@/lib/chat/service";
import { sendConversationMessageSchema } from "@/lib/validations/chat";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const rawBody = await request.json().catch(() => null);
  const parsed = sendConversationMessageSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const message = await sendMessageToConversation({
      conversationId: id,
      userId: sessionUser.id,
      content: parsed.data.content,
      imageDataUrl: parsed.data.imageDataUrl,
    });

    if (message === "demo-readonly") {
      return NextResponse.json(
        { error: "데모 대화에서는 메시지를 보낼 수 없습니다." },
        { status: 400 },
      );
    }

    if (message === "forbidden") {
      return NextResponse.json(
        { error: "이 대화에 메시지를 보낼 권한이 없습니다." },
        { status: 403 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "대화를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "메시지를 보내지 못했습니다.",
      },
      { status: 400 },
    );
  }
}
