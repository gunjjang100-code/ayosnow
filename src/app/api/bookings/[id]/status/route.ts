import { BookingStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { updateBookingStatus } from "@/lib/bookings/manage-booking-service";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import { updateBookingStatusSchema } from "@/lib/validations/chat";

const statusMap = {
  accepted: BookingStatus.ACCEPTED,
  "in-progress": BookingStatus.IN_PROGRESS,
  completed: BookingStatus.COMPLETED,
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = updateBookingStatusSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const booking = await updateBookingStatus({
      bookingId: id,
      actorUserId: sessionUser.id,
      actorRole: sessionUser.role,
      nextStatus: statusMap[parsed.data.status],
    });

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "예약 상태를 바꾸지 못했습니다.",
      },
      { status: toErrorResponseStatus(error, 403) },
    );
  }
}
