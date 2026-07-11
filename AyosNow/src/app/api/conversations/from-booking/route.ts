import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { getOrCreateConversationForBooking } from "@/lib/chat/service";
import { createConversationFromBookingSchema } from "@/lib/validations/chat";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = createConversationFromBookingSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const conversation = await getOrCreateConversationForBooking({
      bookingId: parsed.data.bookingId,
      actorUserId: sessionUser.id,
    });

    return NextResponse.json({
      ok: true,
      conversationId: conversation.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not prepare the chat room.",
      },
      { status: 403 },
    );
  }
}
