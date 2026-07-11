import {
  NotificationChannel,
  NotificationRelatedType,
  NotificationType,
  QuoteRequestStatus,
  QuoteStatus,
} from "@prisma/client";
import crypto from "node:crypto";

import { executeAtomicD1Batch } from "@/lib/d1/atomic-batch";
import { AppError } from "@/lib/errors/app-error";
import { createNotification } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";
import { buildQuoteSelectionBatch } from "@/lib/quotes/quote-selection-batch";
import {
  getVisibleProfessionalBadgesForProfiles,
  refreshTradesmanResponseRateAndBadges,
} from "@/lib/professional-badges/professional-badge-service";
import { assertVerifiedTradesmanForCustomerWorkflow } from "@/lib/tradesmen/verification-service";
import type { ProfessionalBadgeSummary } from "@/lib/types";
import { chargeCreditsForQuoteSubmission, QUOTE_SUBMISSION_CREDIT_COST } from "@/lib/wallets/wallet-service";
import { buildQuoteSubmissionFeeReferenceKey } from "@/lib/wallets/wallet-topup-config";

export interface QuoteWorkspaceOffer {
  id: string;
  requestId: string;
  tradesmanName: string;
  tradesmanSlug: string;
  amountLabel: string;
  arrivalText: string;
  message: string;
  rating: number;
  completedJobs: number;
  status: QuoteStatus;
  tradesmanBadges: ProfessionalBadgeSummary[];
}

export interface QuoteWorkspaceRequest {
  id: string;
  serviceName: string;
  location: string;
  budgetLabel: string;
  targetDate: string;
  statusLabel: string;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function toMoneyLabel(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Budget TBD";
  }

  return `PHP ${value.toLocaleString("en-PH")}`;
}

function toBudgetLabel(
  min: number | null | undefined,
  max: number | null | undefined,
) {
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${toMoneyLabel(min)} - ${toMoneyLabel(max)}`;
  }

  return toMoneyLabel(min ?? max);
}

async function findAcceptedQuoteConversation(params: {
  bookingId?: string;
  quoteId: string;
  quoteRequestId: string;
  tradesmanId: string;
}) {
  return prisma.conversation.findFirst({
    where: {
      OR: [
        ...(params.bookingId ? [{ bookingId: params.bookingId }] : []),
        { quoteId: params.quoteId },
        {
          requestId: params.quoteRequestId,
          tradesmanId: params.tradesmanId,
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function listQuoteWorkspaceForCustomer(customerId: string) {
  const requests = await prisma.quoteRequest.findMany({
    where: {
      customerId,
    },
    include: {
      category: true,
      quotes: {
        include: {
          tradesman: {
            include: {
              tradesmanProfile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const profileIds = requests
    .flatMap((request) =>
      request.quotes.map((quote) => quote.tradesman.tradesmanProfile?.id),
    )
    .filter((value): value is string => Boolean(value));
  const badgeMap = await getVisibleProfessionalBadgesForProfiles(profileIds);

  return requests.map((request) => ({
    request: {
      id: request.id,
      serviceName: request.title,
      location: `${request.city} · ${request.addressLine}`,
      budgetLabel: toBudgetLabel(request.budgetMin, request.budgetMax),
      targetDate: request.targetDate
        ? request.targetDate.toISOString()
        : request.createdAt.toISOString(),
      statusLabel: request.status,
    } satisfies QuoteWorkspaceRequest,
    offers: request.quotes.map((quote) => ({
      id: quote.id,
      requestId: request.id,
      tradesmanName: quote.tradesman.fullName,
      // User IDs are stable and already supported by the public profile route.
      // Names can change and duplicate names can otherwise create broken links.
      tradesmanSlug: quote.tradesman.id,
      amountLabel: toMoneyLabel(quote.amount),
      arrivalText: quote.visitDate
        ? quote.visitDate.toISOString()
        : request.targetDate?.toISOString() ?? request.createdAt.toISOString(),
      message: quote.message,
      rating: quote.tradesman.tradesmanProfile?.averageRating ?? 0,
      completedJobs: quote.tradesman.tradesmanProfile?.completedJobs ?? 0,
      status: quote.status,
      tradesmanBadges: quote.tradesman.tradesmanProfile?.id
        ? badgeMap.get(quote.tradesman.tradesmanProfile.id) ?? []
        : [],
    } satisfies QuoteWorkspaceOffer)),
  }));
}

export async function upsertQuoteForTradesman(params: {
  quoteRequestId: string;
  tradesmanId: string;
  amount: number;
  visitDate?: string;
  message: string;
}) {
  await assertVerifiedTradesmanForCustomerWorkflow(params.tradesmanId);

  const quoteRequest = await prisma.quoteRequest.findUnique({
    where: { id: params.quoteRequestId },
    include: {
      customer: true,
      category: true,
    },
  });

  if (!quoteRequest) {
    throw new AppError("Could not find the quote request.", 404);
  }

  if (quoteRequest.status !== QuoteRequestStatus.OPEN) {
    throw new AppError("This request is closed, so quotes can no longer be sent.", 400);
  }

  const hasNotification = await prisma.notification.findFirst({
    where: {
      userId: params.tradesmanId,
      relatedId: quoteRequest.id,
      relatedType: NotificationRelatedType.QUOTE_REQUEST,
    },
  });

  if (!hasNotification) {
    throw new AppError("You do not have permission to quote this request.", 403);
  }

  const tradesman = await prisma.user.findUnique({
    where: { id: params.tradesmanId },
    include: {
      tradesmanProfile: true,
    },
  });

  if (!tradesman || !tradesman.tradesmanProfile?.isVerified) {
    throw new AppError("Could not find professional information.", 404);
  }

  const existingQuote = await prisma.quote.findUnique({
    where: {
      quoteRequestId_tradesmanId: {
        quoteRequestId: quoteRequest.id,
        tradesmanId: params.tradesmanId,
      },
    },
  });

  const quoteData = {
    amount: Math.round(params.amount),
    visitDate: params.visitDate ? new Date(params.visitDate) : null,
    message: params.message.trim(),
    status: QuoteStatus.PENDING,
  };

  let savedQuote;
  let wasCharged = !existingQuote;

  if (existingQuote) {
    savedQuote = await prisma.quote.update({
      where: { id: existingQuote.id },
      data: quoteData,
    });
  } else {
    try {
      savedQuote = await prisma.quote.create({
        data: {
          id: crypto.randomUUID(),
          quoteRequestId: quoteRequest.id,
          tradesmanId: params.tradesmanId,
          ...quoteData,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      // 같은 전문가가 같은 요청에 아주 빠르게 두 번 제출하면 DB unique 제약이 먼저 막는다.
      // 이때 사용자에게 500 오류를 보여주지 않고, 이미 만들어진 견적을 수정 흐름으로 처리한다.
      const concurrentQuote = await prisma.quote.findUnique({
        where: {
          quoteRequestId_tradesmanId: {
            quoteRequestId: quoteRequest.id,
            tradesmanId: params.tradesmanId,
          },
        },
      });

      if (!concurrentQuote) {
        throw new AppError(
          "Your quote was submitted at the same time. Please reload and try again.",
          409,
        );
      }

      const feeTransaction = await prisma.creditTransaction.findUnique({
        where: {
          referenceKey: buildQuoteSubmissionFeeReferenceKey({
            userId: params.tradesmanId,
            quoteRequestId: quoteRequest.id,
          }),
        },
      });

      if (!feeTransaction) {
        throw new AppError(
          "Your first quote is still being processed. Please wait a moment and reload.",
          409,
        );
      }

      savedQuote = await prisma.quote.update({
        where: { id: concurrentQuote.id },
        data: quoteData,
      });
      wasCharged = false;
    }
  }

  let wallet = await prisma.wallet.findUnique({
    where: { userId: params.tradesmanId },
  });

  if (wasCharged) {
    try {
      wallet = await chargeCreditsForQuoteSubmission({
        userId: params.tradesmanId,
        quoteRequestId: quoteRequest.id,
        quoteId: savedQuote.id,
        amount: QUOTE_SUBMISSION_CREDIT_COST,
      });
    } catch (error) {
      await prisma.quote.delete({
        where: { id: savedQuote.id },
      });

      throw error;
    }
  }

  try {
    await createNotification({
      userId: quoteRequest.customerId,
      type: NotificationType.QUOTE_REQUEST,
      title: "New quote received",
      message: `${tradesman.fullName} sent a quote for ${quoteRequest.title}.`,
      relatedId: quoteRequest.id,
      relatedType: NotificationRelatedType.QUOTE_REQUEST,
    });
  } catch (error) {
    // 견적 저장과 크레딧 차감은 이미 성공한 상태다.
    // 알림만 실패했다고 사용자에게 "견적 제출 실패"로 보이면 중복 재시도를 부를 수 있으므로,
    // 서버 로그만 남기고 견적 제출 자체는 성공으로 응답한다.
    console.error("QUOTE_NOTIFICATION_FAILED", error);
  }

  await refreshTradesmanResponseRateAndBadges(params.tradesmanId).catch(() => null);

  return {
    quote: savedQuote,
    remainingBalance: wallet?.balance ?? 0,
    wasCharged,
  };
}

export async function selectQuoteForCustomer(params: {
  quoteId: string;
  customerId: string;
}) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.quoteId },
    include: {
      tradesman: {
        include: {
          tradesmanProfile: true,
        },
      },
      quoteRequest: true,
      booking: true,
    },
  });

  if (!quote) {
    throw new AppError("Could not find the quote to select.", 404);
  }

  if (!quote.tradesman.tradesmanProfile?.isVerified) {
    throw new AppError("This professional is not verified for booking yet.", 403);
  }

  if (quote.quoteRequest.customerId !== params.customerId) {
    throw new AppError("You do not have permission to select this quote.", 403);
  }

  if (
    quote.quoteRequest.selectedQuoteId &&
    quote.quoteRequest.selectedQuoteId !== quote.id
  ) {
    throw new AppError("Another quote has already been selected for this request.", 400);
  }

  // 견적 선택은 "열려 있는 요청"에서만 허용한다.
  // 이미 매칭되거나 닫힌 요청은 새 예약을 만들 수 없다.
  if (!quote.booking && quote.quoteRequest.status !== QuoteRequestStatus.OPEN) {
    throw new AppError("This quote request is already closed and cannot be selected.", 400);
  }

  // 아직 대기 중인 견적만 선택 가능하게 제한한다.
  // 이미 수락/거절/철회된 견적을 다시 선택하면 상태 관리가 불안정해진다.
  if (!quote.booking && quote.status !== QuoteStatus.PENDING) {
    throw new AppError("This quote cannot be selected in its current status.", 400);
  }

  const scheduledAt =
    quote.visitDate ??
    quote.quoteRequest.targetDate ??
    new Date(Date.now() + 24 * 60 * 60 * 1000);
  const workAddress = `${quote.quoteRequest.city}, ${quote.quoteRequest.addressLine}`;
  const bookingId = quote.booking?.id ?? crypto.randomUUID();
  const existingConversation = await findAcceptedQuoteConversation({
    quoteId: quote.id,
    quoteRequestId: quote.quoteRequestId,
    tradesmanId: quote.tradesmanId,
  });
  const conversationId = existingConversation?.id ?? crypto.randomUUID();

  await executeAtomicD1Batch(
    buildQuoteSelectionBatch({
      quoteId: quote.id,
      quoteRequestId: quote.quoteRequestId,
      customerId: quote.quoteRequest.customerId,
      tradesmanId: quote.tradesmanId,
      bookingId,
      conversationId,
      existingConversationId: existingConversation?.id,
      scheduledAt: scheduledAt.toISOString(),
      amount: quote.amount,
      workAddress,
      requestTitle: quote.quoteRequest.title,
      now: new Date().toISOString(),
      selectedMessageId: crypto.randomUUID(),
      bookingMessageId: crypto.randomUUID(),
      tradesmanNotificationId: crypto.randomUUID(),
      customerNotificationId: crypto.randomUUID(),
    }),
  );

  const persistedBooking = await prisma.booking.findUnique({
    where: { quoteId: quote.id },
  });
  const persistedConversation = persistedBooking
    ? await findAcceptedQuoteConversation({
        bookingId: persistedBooking.id,
        quoteId: quote.id,
        quoteRequestId: quote.quoteRequestId,
        tradesmanId: quote.tradesmanId,
      })
    : null;

  if (!persistedBooking || !persistedConversation) {
    const currentRequest = await prisma.quoteRequest.findUnique({
      where: { id: quote.quoteRequestId },
      select: { selectedQuoteId: true },
    });

    if (currentRequest?.selectedQuoteId && currentRequest.selectedQuoteId !== quote.id) {
      throw new AppError("Another quote has already been selected for this request.", 409);
    }

    throw new AppError(
      "The quote could not be selected safely. No partial booking was created.",
      409,
    );
  }

  const bookingResult = {
    bookingId: persistedBooking.id,
    conversationId: persistedConversation.id,
  };
  const shouldSendExternalNotifications =
    !quote.booking && persistedBooking.id === bookingId;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingResult.bookingId },
      include: {
        quoteRequest: true,
      },
    });

    if (booking && shouldSendExternalNotifications) {
      await Promise.all([
        createNotification({
          userId: booking.tradesmanId,
          type: NotificationType.BOOKING_CREATED,
          title: "The customer selected a quote",
          message: `${booking.quoteRequest?.title ?? "A quote"} was converted into a booking.`,
          relatedId: booking.id,
          relatedType: NotificationRelatedType.BOOKING,
          channels: [
            NotificationChannel.EMAIL,
            NotificationChannel.PUSH,
            NotificationChannel.SMS,
          ],
        }),
        createNotification({
          userId: booking.customerId,
          type: NotificationType.BOOKING_CREATED,
          title: "Booking created",
          message: `${booking.quoteRequest?.title ?? "Your quote"} was confirmed as a booking.`,
          relatedId: booking.id,
          relatedType: NotificationRelatedType.BOOKING,
          channels: [
            NotificationChannel.EMAIL,
            NotificationChannel.PUSH,
            NotificationChannel.SMS,
          ],
        }),
      ]);
    }
  } catch (error) {
    // DB에 반드시 남아야 하는 인앱 알림은 트랜잭션 안에서 이미 저장했다.
    // 푸시/이메일/SMS 같은 외부 발송만 실패했을 때는 예약 흐름을 다시 실패로 만들지 않는다.
    console.error("QUOTE_SELECTION_EXTERNAL_NOTIFICATION_FAILED", error);
  }

  return {
    bookingId: bookingResult.bookingId,
    conversationId: bookingResult.conversationId,
  };
}

export async function rejectQuoteForCustomer(params: {
  quoteId: string;
  customerId: string;
}) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.quoteId },
    include: {
      quoteRequest: true,
    },
  });

  if (!quote) {
    throw new AppError("Could not find the quote to reject.", 404);
  }

  if (quote.quoteRequest.customerId !== params.customerId) {
    throw new AppError("You do not have permission to reject this quote.", 403);
  }

  if (quote.quoteRequest.status !== QuoteRequestStatus.OPEN) {
    throw new AppError("This request is already closed, so quotes can no longer be changed.", 400);
  }

  if (quote.status !== QuoteStatus.PENDING) {
    throw new AppError("Only pending quotes can be rejected.", 400);
  }

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.REJECTED,
    },
  });

  try {
    await createNotification({
      userId: quote.tradesmanId,
      type: NotificationType.QUOTE_REQUEST,
      title: "Quote not selected",
      message: `The customer rejected your quote for ${quote.quoteRequest.title}.`,
      relatedId: quote.quoteRequestId,
      relatedType: NotificationRelatedType.QUOTE_REQUEST,
    });
  } catch (error) {
    console.error("QUOTE_REJECTION_NOTIFICATION_FAILED", error);
  }

  return {
    quoteId: quote.id,
    status: QuoteStatus.REJECTED,
  };
}

export async function withdrawQuoteForTradesman(params: {
  quoteId: string;
  tradesmanId: string;
}) {
  await assertVerifiedTradesmanForCustomerWorkflow(params.tradesmanId);

  const quote = await prisma.quote.findUnique({
    where: { id: params.quoteId },
    include: {
      quoteRequest: true,
    },
  });

  if (!quote) {
    throw new AppError("Could not find the quote to withdraw.", 404);
  }

  if (quote.tradesmanId !== params.tradesmanId) {
    throw new AppError("You can only withdraw your own quote.", 403);
  }

  if (quote.quoteRequest.status !== QuoteRequestStatus.OPEN) {
    throw new AppError("This request is already closed, so the quote cannot be withdrawn.", 400);
  }

  if (quote.status !== QuoteStatus.PENDING) {
    throw new AppError("Only pending quotes can be withdrawn.", 400);
  }

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.WITHDRAWN,
    },
  });

  try {
    await createNotification({
      userId: quote.quoteRequest.customerId,
      type: NotificationType.QUOTE_REQUEST,
      title: "Quote withdrawn",
      message: "A professional withdrew a quote for your request.",
      relatedId: quote.quoteRequestId,
      relatedType: NotificationRelatedType.QUOTE_REQUEST,
    });
  } catch (error) {
    console.error("QUOTE_WITHDRAW_NOTIFICATION_FAILED", error);
  }

  return {
    quoteId: quote.id,
    status: QuoteStatus.WITHDRAWN,
  };
}
