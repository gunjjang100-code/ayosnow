import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { upsertQuoteForTradesman } from "@/lib/quotes/service";
import { tradesmanQuoteSchema } from "@/lib/validations/quote";

function toRequiredNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (sessionUser.role !== "tradesman") {
    return NextResponse.json(
      { error: "견적 제출은 전문가만 가능합니다." },
      { status: 403 },
    );
  }

  const rawBody = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = tradesmanQuoteSchema.safeParse({
    quoteRequestId: rawBody?.quoteRequestId,
    amount: toRequiredNumber(rawBody?.amount),
    visitDate: rawBody?.visitDate,
    message: rawBody?.message,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await upsertQuoteForTradesman({
      quoteRequestId: parsed.data.quoteRequestId,
      tradesmanId: sessionUser.id,
      amount: parsed.data.amount,
      visitDate: parsed.data.visitDate,
      message: parsed.data.message,
    });

    return NextResponse.json({
      ok: true,
      quoteId: result.quote.id,
      remainingBalance: result.remainingBalance.toString(),
      wasCharged: result.wasCharged,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
}
