import { NextResponse, type NextRequest } from "next/server";

import { getFreshRoleStateForUser } from "@/lib/auth/role-state";
import { getRequestSessionUser } from "@/lib/auth/session";
import { createInstantBooking } from "@/lib/bookings/instant-booking-service";
import { instantBookingSchema } from "@/lib/validations/instant-booking";

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
      { error: "Instant bookings can only be created by customer accounts." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = instantBookingSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const booking = await createInstantBooking({
    customerId: sessionUser.id,
    serviceSlug: parsed.data.serviceSlug,
  });

  return NextResponse.json({
    ok: true,
    bookingId: booking.id,
  });
}
