import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { cancelBooking } from "@/lib/bookings/manage-booking-service";
import { toErrorResponseStatus } from "@/lib/errors/app-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const booking = await cancelBooking({
      bookingId: id,
      actorUserId: sessionUser.id,
      actorRole: sessionUser.role,
    });

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not cancel the booking.",
      },
      { status: toErrorResponseStatus(error, 403) },
    );
  }
}
