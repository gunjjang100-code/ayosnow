import { NotificationRelatedType, NotificationType } from "@prisma/client";

import { addBookingCreatedSystemMessage } from "@/lib/chat/service";
import { createNotification } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";
import { assertVerifiedTradesmanForCustomerWorkflow } from "@/lib/tradesmen/verification-service";

export async function createInstantBooking(params: {
  customerId: string;
  serviceSlug: string;
}) {
  const service = await prisma.service.findUnique({
    where: { slug: params.serviceSlug },
    include: {
      owner: {
        include: {
          tradesmanProfile: true,
        },
      },
      category: true,
    },
  });

  if (!service || !service.isPublished || !service.owner.tradesmanProfile?.isVerified) {
    throw new Error("Could not find an available service.");
  }

  await assertVerifiedTradesmanForCustomerWorkflow(service.ownerId);

  const customer = await prisma.user.findUnique({
    where: { id: params.customerId },
  });

  if (!customer) {
    throw new Error("Could not find the booking customer.");
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
    title: "New booking received",
    message: `A booking for ${service.title} was received.`,
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
