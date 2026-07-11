import { NextResponse, type NextRequest } from "next/server";

import { getFreshRoleStateForUser } from "@/lib/auth/role-state";
import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import { selectQuoteForCustomer } from "@/lib/quotes/service";
import { selectQuoteSchema } from "@/lib/validations/chat";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const roleState = await getFreshRoleStateForUser(sessionUser.id);
  if (roleState.needsRoleSelection) {
    return NextResponse.json(
      { error: "Please choose your account role first." },
      { status: 403 },
    );
  }

  if (roleState.role !== "customer") {
    return NextResponse.json(
      { error: "Quotes can only be selected by customer accounts." },
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
          error instanceof Error ? error.message : "Could not select the quote.",
      },
      { status: toErrorResponseStatus(error, 400) },
    );
  }
}
