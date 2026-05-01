import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { createInstantBooking } from "@/lib/bookings/instant-booking-service";
import { instantBookingSchema } from "@/lib/validations/instant-booking";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (sessionUser.role !== "customer") {
    return NextResponse.json(
      { error: "즉시 예약 생성은 고객 계정에서만 가능합니다." },
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
