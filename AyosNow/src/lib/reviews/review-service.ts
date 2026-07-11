import { BookingStatus, NotificationRelatedType, NotificationType } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { createNotifications } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";
import { syncProfessionalBadgesForProfile } from "@/lib/professional-badges/professional-badge-service";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function refreshTradesmanRating(tradesmanId: string) {
  const reviewStats = await prisma.review.aggregate({
    where: { targetUserId: tradesmanId },
    _avg: { rating: true },
  });

  const completedJobs = await prisma.booking.count({
    where: {
      tradesmanId,
      status: BookingStatus.COMPLETED,
    },
  });

  await prisma.tradesmanProfile.updateMany({
    where: { userId: tradesmanId },
    data: {
      averageRating: reviewStats._avg.rating ?? 0,
      completedJobs,
    },
  });

  const profile = await prisma.tradesmanProfile.findUnique({
    where: { userId: tradesmanId },
    select: { id: true },
  });

  if (profile) {
    await syncProfessionalBadgesForProfile({
      profileId: profile.id,
      reason: "Review and completed booking metrics changed.",
    });
  }
}

export async function createBookingReview(params: {
  bookingId: string;
  authorId: string;
  rating: number;
  comment: string;
  photoUrl?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: {
      id: true,
      customerId: true,
      tradesmanId: true,
      status: true,
    },
  });

  if (!booking) {
    throw new AppError("Could not find a booking for this review.", 404);
  }

  if (booking.customerId !== params.authorId) {
    throw new AppError("Only the customer for this booking can leave a review.", 403);
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    throw new AppError("Reviews can only be added to completed bookings.", 400);
  }

  try {
    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        authorId: params.authorId,
        targetUserId: booking.tradesmanId,
        rating: params.rating,
        comment: params.comment,
        photoUrl: params.photoUrl,
      },
    });

    await refreshTradesmanRating(booking.tradesmanId);

    await createNotifications([
      {
        userId: booking.tradesmanId,
        type: NotificationType.BOOKING_CREATED,
        title: "New review received",
        message: "A customer left a review for a completed job.",
        relatedId: booking.id,
        relatedType: NotificationRelatedType.BOOKING,
      },
    ]);

    return review;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("You already reviewed this booking.", 409);
    }

    throw error;
  }
}
