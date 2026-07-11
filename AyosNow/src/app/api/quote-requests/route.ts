import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import { createQuoteRequest } from "@/lib/quote-requests/quote-request-service";
import { quoteRequestSchema } from "@/lib/validations/quote-request";

function toOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "customer") {
    return NextResponse.json(
      { error: "Quote requests can only be created by customer accounts." },
      { status: 403 },
    );
  }

  const rawBody = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  const parsed = quoteRequestSchema.safeParse({
    categorySlug: rawBody?.categorySlug,
    title: rawBody?.title,
    description: rawBody?.description,
    city: rawBody?.city,
    addressLine: rawBody?.addressLine,
    budgetMin: toOptionalNumber(rawBody?.budgetMin),
    budgetMax: toOptionalNumber(rawBody?.budgetMax),
    targetDate: rawBody?.targetDate,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await createQuoteRequest({
      customerId: sessionUser.id,
      input: parsed.data,
    });

    return NextResponse.json({
      ok: true,
      quoteRequestId: result.quoteRequest.id,
      matchedTradesmenCount: result.matchedTradesmenCount,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not submit the request. Please try again shortly.";

    return NextResponse.json(
      {
        error: {
          formErrors: [message],
          fieldErrors: {},
        },
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
