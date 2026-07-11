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
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
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
      imageFileName: parsed.data.imageFileName,
      fileDataUrl: parsed.data.fileDataUrl,
      fileName: parsed.data.fileName,
      fileMimeType: parsed.data.fileMimeType,
      fileSizeBytes: parsed.data.fileSizeBytes,
    });

    if (message === "forbidden") {
      return NextResponse.json(
        { error: "You do not have permission to send messages in this conversation." },
        { status: 403 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Conversation not found." },
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
          error instanceof Error ? error.message : "Could not send the message.",
      },
      { status: 400 },
    );
  }
}
