import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { AppError, toErrorResponseStatus } from "@/lib/errors/app-error";
import { withdrawQuoteForTradesman } from "@/lib/quotes/service";
import { selectQuoteSchema } from "@/lib/validations/chat";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "tradesman") {
    return NextResponse.json(
      { error: "Only professional accounts can withdraw quotes." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = selectQuoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await withdrawQuoteForTradesman({
      quoteId: parsed.data.quoteId,
      tradesmanId: sessionUser.id,
    });

    return NextResponse.json({
      ok: true,
      quoteId: result.quoteId,
      status: result.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AppError || error instanceof Error
            ? error.message
            : "Could not withdraw the quote.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
