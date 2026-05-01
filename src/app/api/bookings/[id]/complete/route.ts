import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { completeBooking } from "@/lib/bookings/manage-booking-service";
import { toErrorResponseStatus } from "@/lib/errors/app-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const booking = await completeBooking({
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
          error instanceof Error ? error.message : "작업 완료 처리를 하지 못했습니다.",
      },
      { status: toErrorResponseStatus(error, 403) },
    );
  }
}
