import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import {
  cancelQuoteRequestForCustomer,
  updateQuoteRequestForCustomer,
} from "@/lib/quote-requests/quote-request-service";
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

function parseQuoteRequestBody(rawBody: Record<string, unknown> | null) {
  return quoteRequestSchema.safeParse({
    categorySlug: rawBody?.categorySlug,
    title: rawBody?.title,
    description: rawBody?.description,
    city: rawBody?.city,
    addressLine: rawBody?.addressLine,
    budgetMin: toOptionalNumber(rawBody?.budgetMin),
    budgetMax: toOptionalNumber(rawBody?.budgetMax),
    targetDate: rawBody?.targetDate,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "customer") {
    return NextResponse.json(
      { error: "Only customer accounts can update quote requests." },
      { status: 403 },
    );
  }

  const rawBody = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const parsed = parseQuoteRequestBody(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const quoteRequest = await updateQuoteRequestForCustomer({
      quoteRequestId: id,
      customerId: sessionUser.id,
      input: parsed.data,
    });

    return NextResponse.json({
      ok: true,
      quoteRequestId: quoteRequest.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update the quote request.",
      },
      { status: toErrorResponseStatus(error, 403) },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "customer") {
    return NextResponse.json(
      { error: "Only customer accounts can cancel quote requests." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const quoteRequest = await cancelQuoteRequestForCustomer({
      quoteRequestId: id,
      customerId: sessionUser.id,
    });

    return NextResponse.json({
      ok: true,
      quoteRequestId: quoteRequest.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not cancel the quote request.",
      },
      { status: toErrorResponseStatus(error, 403) },
    );
  }
}
