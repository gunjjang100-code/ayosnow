import {
  BookingStatus,
  NotificationRelatedType,
  NotificationType,
} from "@prisma/client";

import type { UserRole } from "@/lib/types";

import {
  addBookingAcceptedSystemMessage,
  addBookingCancelledSystemMessage,
  addBookingCompletedSystemMessage,
  addBookingScheduleChangedSystemMessage,
  addBookingStartedSystemMessage,
} from "@/lib/chat/service";
import { AppError } from "@/lib/errors/app-error";
import { createNotifications } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";
import { syncProfessionalBadgesForProfile } from "@/lib/professional-badges/professional-badge-service";
import { assertVerifiedTradesmanForCustomerWorkflow } from "@/lib/tradesmen/verification-service";
import { canCancelBooking } from "./booking-cancel-policy";

async function getAccessibleBooking(
  bookingId: string,
  actorUserId: string,
  actorRole?: UserRole,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError("Could not find the target booking.", 404);
  }

  if (
    actorRole !== "admin" &&
    booking.customerId !== actorUserId &&
    booking.tradesmanId !== actorUserId
  ) {
    throw new AppError("You do not have permission to update this booking.", 403);
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

async function getBookingAfterGuardedUpdate(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError("Could not find the updated booking.", 404);
  }

  return booking;
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

async function refreshTradesmanBookingBadgeMetrics(tradesmanId: string) {
  const [completedJobs, profile] = await Promise.all([
    prisma.booking.count({
      where: {
        tradesmanId,
        status: BookingStatus.COMPLETED,
      },
    }),
    prisma.tradesmanProfile.findUnique({
      where: { userId: tradesmanId },
      select: { id: true },
    }),
  ]);

  if (!profile) {
    return;
  }

  await prisma.tradesmanProfile.update({
    where: { id: profile.id },
    data: { completedJobs },
  });

  await syncProfessionalBadgesForProfile({
    profileId: profile.id,
    reason: "Booking status changed.",
  });
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
    throw new AppError("Only professionals or admins can reschedule bookings.", 403);
  }

  if (params.actorRole !== "admin") {
    await assertVerifiedTradesmanForCustomerWorkflow(params.actorUserId);
  }

  // 방문 시간 변경은 실제로 아직 진행 중인 예약에서만 허용한다.
  // 이미 끝났거나 취소된 예약 일정이 다시 바뀌면 운영 기록이 꼬이기 쉽다.
  if (
    booking.status === BookingStatus.COMPLETED ||
    booking.status === BookingStatus.CANCELLED
  ) {
    throw new AppError("Completed or cancelled bookings cannot be rescheduled.", 400);
  }

  const updateResult = await prisma.booking.updateMany({
    where: {
      id: params.bookingId,
      status: {
        notIn: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      },
    },
    data: {
      scheduledAt: params.scheduledAt,
    },
  });

  if (updateResult.count !== 1) {
    throw new AppError("This booking changed before the schedule could be updated. Please refresh and try again.", 409);
  }

  const updatedBooking = await getBookingAfterGuardedUpdate(params.bookingId);

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
    throw new AppError("Only professionals or admins can mark work complete.", 403);
  }

  if (params.actorRole !== "admin") {
    await assertVerifiedTradesmanForCustomerWorkflow(params.actorUserId);
  }

  if (currentBooking.status === BookingStatus.COMPLETED) {
    throw new AppError("This booking is already completed.", 400);
  }

  if (
    currentBooking.status !== BookingStatus.ACCEPTED &&
    currentBooking.status !== BookingStatus.IN_PROGRESS
  ) {
    throw new AppError("Only accepted or in-progress bookings can be marked complete.", 400);
  }

  const updateResult = await prisma.booking.updateMany({
    where: {
      id: params.bookingId,
      status: {
        in: [BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS],
      },
    },
    data: {
      status: BookingStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  if (updateResult.count !== 1) {
    throw new AppError("This booking changed before it could be completed. Please refresh and try again.", 409);
  }

  const booking = await getBookingAfterGuardedUpdate(params.bookingId);

  await addBookingCompletedSystemMessage({
    bookingId: booking.id,
    actorUserId: params.actorUserId,
  });

  await notifyBookingUpdate({
    bookingId: booking.id,
    actorRole: params.actorRole,
    customerId: booking.customerId,
    tradesmanId: booking.tradesmanId,
    title: "Work completed",
    message: "The booking was moved to completed.",
  });

  await refreshTradesmanBookingBadgeMetrics(booking.tradesmanId);

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
    throw new AppError("Only professionals or admins can update booking progress.", 403);
  }

  if (params.actorRole !== "admin") {
    await assertVerifiedTradesmanForCustomerWorkflow(params.actorUserId);
  }

  const allowedTransitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
    [BookingStatus.PENDING]: [BookingStatus.ACCEPTED],
    [BookingStatus.ACCEPTED]: [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED],
    [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
  };

  const nextCandidates = allowedTransitions[booking.status] ?? [];

  if (!nextCandidates.includes(params.nextStatus)) {
    throw new AppError("This change is not allowed for the current status.", 400);
  }

  if (params.nextStatus === BookingStatus.COMPLETED) {
    const updateResult = await prisma.booking.updateMany({
      where: {
        id: booking.id,
        status: booking.status,
      },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    if (updateResult.count !== 1) {
      throw new AppError("This booking changed before it could be completed. Please refresh and try again.", 409);
    }

    const finalizedBooking = await getBookingAfterGuardedUpdate(booking.id);

    await addBookingCompletedSystemMessage({
      bookingId: finalizedBooking.id,
      actorUserId: params.actorUserId,
    });

    await notifyBookingUpdate({
      bookingId: finalizedBooking.id,
      actorRole: params.actorRole,
      customerId: finalizedBooking.customerId,
      tradesmanId: finalizedBooking.tradesmanId,
      title: "Work completed",
      message: "The booking was moved to completed.",
    });

    await refreshTradesmanBookingBadgeMetrics(finalizedBooking.tradesmanId);

    return finalizedBooking;
  }

  const updateResult = await prisma.booking.updateMany({
    where: {
      id: params.bookingId,
      status: booking.status,
    },
    data: {
      status: params.nextStatus,
    },
  });

  if (updateResult.count !== 1) {
    throw new AppError("This booking changed before its status could be updated. Please refresh and try again.", 409);
  }

  const updatedBooking = await getBookingAfterGuardedUpdate(params.bookingId);

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
      title: "The professional accepted the booking",
      message: "You can now prepare for the scheduled visit.",
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
      title: "Work started",
      message: "The professional started the on-site work.",
    });
  }

  return updatedBooking;
}

export async function cancelBooking(params: {
  bookingId: string;
  actorUserId: string;
  actorRole: UserRole;
}) {
  const booking = await getAccessibleBooking(
    params.bookingId,
    params.actorUserId,
    params.actorRole,
  );

  if (
    !canCancelBooking({
      status: booking.status,
      actorRole: params.actorRole,
    })
  ) {
    throw new AppError("This booking cannot be cancelled by this account.", 400);
  }

  if (params.actorRole === "tradesman") {
    await assertVerifiedTradesmanForCustomerWorkflow(params.actorUserId);
  }

  const cancellableStatuses =
    params.actorRole === "admin"
      ? [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS]
      : [BookingStatus.PENDING, BookingStatus.ACCEPTED];

  const updateResult = await prisma.booking.updateMany({
    where: {
      id: booking.id,
      status: {
        in: cancellableStatuses,
      },
    },
    data: {
      status: BookingStatus.CANCELLED,
    },
  });

  if (updateResult.count !== 1) {
    throw new AppError("This booking changed before it could be cancelled. Please refresh and try again.", 409);
  }

  const cancelledBooking = await getBookingAfterGuardedUpdate(booking.id);

  await addBookingCancelledSystemMessage({
    bookingId: cancelledBooking.id,
    actorUserId: params.actorUserId,
  });

  const targetUserIds =
    params.actorRole === "admin"
      ? [cancelledBooking.customerId, cancelledBooking.tradesmanId]
      : [cancelledBooking.customerId, cancelledBooking.tradesmanId].filter(
          (userId) => userId !== params.actorUserId,
        );

  await createNotifications(
    [...new Set(targetUserIds)].map((userId) => ({
      userId,
      type: NotificationType.BOOKING_CREATED,
      title: "Booking cancelled",
      message: "The booking was cancelled.",
      relatedId: cancelledBooking.id,
      relatedType: NotificationRelatedType.BOOKING,
    })),
  );

  await refreshTradesmanBookingBadgeMetrics(cancelledBooking.tradesmanId);

  return cancelledBooking;
}
