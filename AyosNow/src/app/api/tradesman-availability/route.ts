import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { AppError, toErrorResponseStatus } from "@/lib/errors/app-error";
import { getCurrentLocale } from "@/lib/i18n-server";
import { updateTradesmanAvailability } from "@/lib/tradesmen/availability-service";
import { tradesmanAvailabilityUpdateSchema } from "@/lib/validations/availability";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = tradesmanAvailabilityUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const locale = await getCurrentLocale();
    const availability = await updateTradesmanAvailability({
      userId: sessionUser.id,
      role: sessionUser.role,
      locale,
      availability: parsed.data.availability,
    });

    return NextResponse.json({ ok: true, availability });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AppError || error instanceof Error
            ? error.message
            : "Could not update availability.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
