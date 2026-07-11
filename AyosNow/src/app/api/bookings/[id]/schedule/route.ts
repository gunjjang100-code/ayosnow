import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { rescheduleBooking } from "@/lib/bookings/manage-booking-service";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import { rescheduleBookingSchema } from "@/lib/validations/chat";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = rescheduleBookingSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const booking = await rescheduleBooking({
      bookingId: id,
      actorUserId: sessionUser.id,
      actorRole: sessionUser.role,
      scheduledAt: new Date(parsed.data.scheduledAt),
    });

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update the booking time.",
      },
      { status: toErrorResponseStatus(error, 403) },
    );
  }
}
