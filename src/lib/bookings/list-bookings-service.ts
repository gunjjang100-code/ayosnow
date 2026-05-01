import { BookingStatus as PrismaBookingStatus } from "@prisma/client";

import { formatDateTimeLabel } from "@/lib/date-time";
import { prisma } from "@/lib/prisma";
import type { BookingPreview, BookingStatus, Locale, UserRole } from "@/lib/types";

function toUiBookingStatus(status: PrismaBookingStatus): BookingStatus {
  if (status === PrismaBookingStatus.ACCEPTED) {
    return "accepted";
  }

  if (status === PrismaBookingStatus.IN_PROGRESS) {
    return "in-progress";
  }

  if (status === PrismaBookingStatus.COMPLETED) {
    return "completed";
  }

  if (status === PrismaBookingStatus.CANCELLED) {
    return "cancelled";
  }

  return "pending";
}

function getBookingMode(params: {
  quoteId: string | null;
  quoteRequestId: string | null;
}): BookingPreview["mode"] {
  return params.quoteId || params.quoteRequestId ? "quote-match" : "instant-booking";
}

export async function listBookingPreviewsForUser(params: {
  sessionUserId: string;
  role: UserRole;
  locale: Locale;
}) {
  // 이 함수는 "예약 목록용 가벼운 카드 데이터"만 만드는 변환기다.
  // 상세 화면에서 쓰는 모든 관계를 다 가져오지 않고,
  // 목록에 필요한 핵심 정보만 뽑아서 화면을 빠르게 유지한다.
  const where =
    params.role === "customer"
      ? { customerId: params.sessionUserId }
      : params.role === "tradesman"
        ? { tradesmanId: params.sessionUserId }
        : undefined;

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: params.role === "admin" ? 20 : 12,
    include: {
      customer: {
        select: {
          fullName: true,
        },
      },
      tradesman: {
        select: {
          fullName: true,
        },
      },
      service: {
        select: {
          title: true,
        },
      },
      quoteRequest: {
        select: {
          title: true,
          city: true,
        },
      },
    },
  });

  return bookings.map<BookingPreview>((booking) => ({
    id: booking.id,
    // 즉시 예약이면 서비스 제목을 우선 쓰고,
    // 견적 예약이면 요청 제목으로 내려간다.
    // 둘 다 없을 때는 목록이 비지 않도록 마지막 기본 제목을 둔다.
    title: booking.service?.title ?? booking.quoteRequest?.title ?? "예약 작업",
    customerName: booking.customer.fullName,
    tradesmanName: booking.tradesman.fullName,
    dateLabel: formatDateTimeLabel(params.locale, booking.scheduledAt.toISOString()),
    location: booking.quoteRequest?.city ?? booking.workAddress,
    status: toUiBookingStatus(booking.status),
    mode: getBookingMode({
      quoteId: booking.quoteId,
      quoteRequestId: booking.quoteRequestId,
    }),
  }));
}
