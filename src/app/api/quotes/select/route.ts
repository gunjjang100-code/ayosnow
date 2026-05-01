import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import { selectQuoteForCustomer } from "@/lib/quotes/service";
import { selectQuoteSchema } from "@/lib/validations/chat";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (sessionUser.role !== "customer") {
    return NextResponse.json(
      { error: "견적 선택은 고객 계정에서만 가능합니다." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = selectQuoteSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await selectQuoteForCustomer({
      quoteId: parsed.data.quoteId,
      customerId: sessionUser.id,
    });

    return NextResponse.json({
      ok: true,
      bookingId: result.bookingId,
      conversationId: result.conversationId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "견적을 선택하지 못했습니다.",
      },
      { status: toErrorResponseStatus(error, 400) },
    );
  }
}
