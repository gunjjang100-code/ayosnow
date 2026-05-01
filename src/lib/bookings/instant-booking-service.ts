import { NotificationRelatedType, NotificationType } from "@prisma/client";

import { addBookingCreatedSystemMessage } from "@/lib/chat/service";
import { createNotification } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";

export async function createInstantBooking(params: {
  customerId: string;
  serviceSlug: string;
}) {
  const service = await prisma.service.findUnique({
    where: { slug: params.serviceSlug },
    include: {
      owner: true,
      category: true,
    },
  });

  if (!service || !service.isPublished) {
    throw new Error("예약 가능한 서비스를 찾지 못했습니다.");
  }

  const customer = await prisma.user.findUnique({
    where: { id: params.customerId },
  });

  if (!customer) {
    throw new Error("예약을 만든 고객 정보를 찾지 못했습니다.");
  }

  const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const workAddress =
    [customer.city, customer.barangay].filter(Boolean).join(", ") || "To be confirmed";

  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      tradesmanId: service.ownerId,
      serviceId: service.id,
      scheduledAt,
      finalAmount: service.basePriceMin,
      workAddress,
      status: "PENDING",
    },
    include: {
      service: true,
      tradesman: true,
      customer: true,
    },
  });

  await createNotification({
    userId: service.ownerId,
    type: NotificationType.BOOKING_CREATED,
    title: "새 예약이 도착했습니다",
    message: `${service.title} 예약이 접수되었습니다.`,
    relatedId: booking.id,
    relatedType: NotificationRelatedType.BOOKING,
  });

  // 예약이 만들어지는 순간 같은 일거리에 묶인 채팅방도 함께 준비해 둔다.
  // 그래야 고객이 "예약 상세로 간 뒤 다시 채팅을 따로 여는" 번거로움이 줄어든다.
  await addBookingCreatedSystemMessage({
    bookingId: booking.id,
    actorUserId: customer.id,
  });

  return booking;
}
