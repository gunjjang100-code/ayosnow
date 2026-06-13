import {
  BookingStatus,
  NotificationRelatedType,
  NotificationType,
} from "@prisma/client";

import type { UserRole } from "@/lib/types";

import {
  addBookingAcceptedSystemMessage,
  addBookingCompletedSystemMessage,
  addBookingScheduleChangedSystemMessage,
  addBookingStartedSystemMessage,
} from "@/lib/chat/service";
import { AppError } from "@/lib/errors/app-error";
import { createNotifications } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";

async function getAccessibleBooking(
  bookingId: string,
  actorUserId: string,
  actorRole?: UserRole,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError("대상 예약을 찾지 못했습니다.", 404);
  }

  if (
    actorRole !== "admin" &&
    booking.customerId !== actorUserId &&
    booking.tradesmanId !== actorUserId
  ) {
    throw new AppError("이 예약을 수정할 권한이 없습니다.", 403);
  }

  return booking;
}

function canManageBookingProgress(params: {
  actorUserId: string;
  actorRole: UserRole;
  tradesmanId: string;
}) {
  return params.actorRole === "admin" || params.tradesmanId === params.actorUserId;
}

async function notifyBookingUpdate(params: {
  bookingId: string;
  actorRole: UserRole;
  customerId: string;
  tradesmanId: string;
  title: string;
  message: string;
}) {
  // 관리자 처리일 때는 고객/전문가 모두 같은 알림을 보게 한다.
  // 전문가가 직접 처리한 경우엔 상대방인 고객에게만 보낸다.
  const targetUserIds =
    params.actorRole === "admin"
      ? [params.customerId, params.tradesmanId]
      : [params.customerId];

  await createNotifications(
    [...new Set(targetUserIds)].map((userId) => ({
      userId,
      type: NotificationType.BOOKING_CREATED,
      title: params.title,
      message: params.message,
      relatedId: params.bookingId,
      relatedType: NotificationRelatedType.BOOKING,
    })),
  );
}

export async function rescheduleBooking(params: {
  bookingId: string;
  actorUserId: string;
  actorRole: UserRole;
  scheduledAt: Date;
}) {
  const booking = await getAccessibleBooking(
    params.bookingId,
    params.actorUserId,
    params.actorRole,
  );

  if (
    !canManageBookingProgress({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      tradesmanId: booking.tradesmanId,
    })
  ) {
    throw new AppError("예약 시간 변경은 전문가 또는 관리자만 할 수 있습니다.", 403);
  }

  // 방문 시간 변경은 실제로 아직 진행 중인 예약에서만 허용한다.
  // 이미 끝났거나 취소된 예약 일정이 다시 바뀌면 운영 기록이 꼬이기 쉽다.
  if (
    booking.status === BookingStatus.COMPLETED ||
    booking.status === BookingStatus.CANCELLED
  ) {
    throw new AppError("완료되거나 취소된 예약은 시간을 바꿀 수 없습니다.", 400);
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: params.bookingId },
    data: {
      scheduledAt: params.scheduledAt,
    },
  });

  await addBookingScheduleChangedSystemMessage({
    bookingId: updatedBooking.id,
    actorUserId: params.actorUserId,
  });

  return updatedBooking;
}

export async function completeBooking(params: {
  bookingId: string;
  actorUserId: string;
  actorRole: UserRole;
}) {
  const currentBooking = await getAccessibleBooking(
    params.bookingId,
    params.actorUserId,
    params.actorRole,
  );

  if (
    !canManageBookingProgress({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      tradesmanId: currentBooking.tradesmanId,
    })
  ) {
    throw new AppError("작업 완료 처리는 전문가 또는 관리자만 할 수 있습니다.", 403);
  }

  if (currentBooking.status === BookingStatus.COMPLETED) {
    throw new AppError("이미 완료된 예약입니다.", 400);
  }

  if (
    currentBooking.status !== BookingStatus.ACCEPTED &&
    currentBooking.status !== BookingStatus.IN_PROGRESS
  ) {
    throw new AppError("수락되었거나 진행 중인 예약만 완료 처리할 수 있습니다.", 400);
  }

  const booking = await prisma.booking.update({
    where: { id: params.bookingId },
    data: {
      status: BookingStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  await addBookingCompletedSystemMessage({
    bookingId: booking.id,
    actorUserId: params.actorUserId,
  });

  await notifyBookingUpdate({
    bookingId: booking.id,
    actorRole: params.actorRole,
    customerId: booking.customerId,
    tradesmanId: booking.tradesmanId,
    title: "작업이 완료되었습니다",
    message: "예약 작업이 완료 단계로 변경되었습니다.",
  });

  return booking;
}

export async function updateBookingStatus(params: {
  bookingId: string;
  actorUserId: string;
  actorRole: UserRole;
  nextStatus: BookingStatus;
}) {
  const booking = await getAccessibleBooking(
    params.bookingId,
    params.actorUserId,
    params.actorRole,
  );

  if (
    !canManageBookingProgress({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      tradesmanId: booking.tradesmanId,
    })
  ) {
    throw new AppError("예약 진행 상태 변경은 전문가 또는 관리자만 할 수 있습니다.", 403);
  }

  const allowedTransitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
    [BookingStatus.PENDING]: [BookingStatus.ACCEPTED],
    [BookingStatus.ACCEPTED]: [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED],
    [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
  };

  const nextCandidates = allowedTransitions[booking.status] ?? [];

  if (!nextCandidates.includes(params.nextStatus)) {
    throw new AppError("지금 상태에서는 이 변경을 할 수 없습니다.", 400);
  }

  if (params.nextStatus === BookingStatus.COMPLETED) {
    const finalizedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await addBookingCompletedSystemMessage({
      bookingId: finalizedBooking.id,
      actorUserId: params.actorUserId,
    });

    await notifyBookingUpdate({
      bookingId: finalizedBooking.id,
      actorRole: params.actorRole,
      customerId: finalizedBooking.customerId,
      tradesmanId: finalizedBooking.tradesmanId,
      title: "작업이 완료되었습니다",
      message: "예약 작업이 완료 단계로 변경되었습니다.",
    });

    return finalizedBooking;
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: params.bookingId },
    data: {
      status: params.nextStatus,
    },
  });

  if (params.nextStatus === BookingStatus.ACCEPTED) {
    await addBookingAcceptedSystemMessage({
      bookingId: updatedBooking.id,
      actorUserId: params.actorUserId,
    });

    await notifyBookingUpdate({
      bookingId: updatedBooking.id,
      actorRole: params.actorRole,
      customerId: updatedBooking.customerId,
      tradesmanId: updatedBooking.tradesmanId,
      title: "전문가가 예약을 수락했습니다",
      message: "이제 방문 일정에 맞춰 작업 준비를 진행할 수 있습니다.",
    });
  }

  if (params.nextStatus === BookingStatus.IN_PROGRESS) {
    await addBookingStartedSystemMessage({
      bookingId: updatedBooking.id,
      actorUserId: params.actorUserId,
    });

    await notifyBookingUpdate({
      bookingId: updatedBooking.id,
      actorRole: params.actorRole,
      customerId: updatedBooking.customerId,
      tradesmanId: updatedBooking.tradesmanId,
      title: "작업이 시작되었습니다",
      message: "전문가가 현장 작업을 시작했습니다.",
    });
  }

  return updatedBooking;
}
