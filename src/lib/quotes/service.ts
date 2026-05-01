import {
  MessageSenderRole,
  MessageType,
  NotificationRelatedType,
  NotificationType,
  Prisma,
  QuoteRequestStatus,
  QuoteStatus,
} from "@prisma/client";

import {
  getOrCreateConversationForBooking,
} from "@/lib/chat/service";
import { AppError } from "@/lib/errors/app-error";
import { createNotification } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";
import { chargeCreditsForQuoteSubmission, QUOTE_SUBMISSION_CREDIT_COST } from "@/lib/wallets/wallet-service";

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
}

export interface QuoteWorkspaceRequest {
  id: string;
  serviceName: string;
  location: string;
  budgetLabel: string;
  targetDate: string;
  statusLabel: string;
}

function toMoneyLabel(value: Prisma.Decimal | null | undefined) {
  if (!value) {
    return "Budget TBD";
  }

  return `PHP ${value.toString()}`;
}

function toBudgetLabel(
  min: Prisma.Decimal | null | undefined,
  max: Prisma.Decimal | null | undefined,
) {
  if (min && max) {
    return `${toMoneyLabel(min)} - ${toMoneyLabel(max)}`;
  }

  return toMoneyLabel(min ?? max);
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
      tradesmanSlug: quote.tradesman.fullName.toLowerCase().replace(/\s+/g, "-"),
      amountLabel: toMoneyLabel(quote.amount),
      arrivalText: quote.visitDate
        ? quote.visitDate.toISOString()
        : request.targetDate?.toISOString() ?? request.createdAt.toISOString(),
      message: quote.message,
      rating: quote.tradesman.tradesmanProfile?.averageRating ?? 0,
      completedJobs: quote.tradesman.tradesmanProfile?.completedJobs ?? 0,
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
  const quoteRequest = await prisma.quoteRequest.findUnique({
    where: { id: params.quoteRequestId },
    include: {
      customer: true,
      category: true,
    },
  });

  if (!quoteRequest) {
    throw new AppError("견적 요청을 찾지 못했습니다.", 404);
  }

  if (quoteRequest.status !== QuoteRequestStatus.OPEN) {
    throw new AppError("이미 닫힌 요청이라 지금은 견적을 보낼 수 없습니다.", 400);
  }

  const hasNotification = await prisma.notification.findFirst({
    where: {
      userId: params.tradesmanId,
      relatedId: quoteRequest.id,
      relatedType: NotificationRelatedType.QUOTE_REQUEST,
    },
  });

  if (!hasNotification) {
    throw new AppError("이 요청에 견적을 보낼 권한이 없습니다.", 403);
  }

  const tradesman = await prisma.user.findUnique({
    where: { id: params.tradesmanId },
  });

  if (!tradesman) {
    throw new AppError("전문가 정보를 찾지 못했습니다.", 404);
  }

  const { quote, wallet, wasCharged } = await prisma.$transaction(async (tx) => {
    const existingQuote = await tx.quote.findUnique({
      where: {
        quoteRequestId_tradesmanId: {
          quoteRequestId: quoteRequest.id,
          tradesmanId: params.tradesmanId,
        },
      },
    });

    const savedQuote = existingQuote
      ? await tx.quote.update({
          where: { id: existingQuote.id },
          data: {
            amount: new Prisma.Decimal(params.amount),
            visitDate: params.visitDate ? new Date(params.visitDate) : null,
            message: params.message.trim(),
            status: QuoteStatus.PENDING,
          },
        })
      : await tx.quote.create({
          data: {
            quoteRequestId: quoteRequest.id,
            tradesmanId: params.tradesmanId,
            amount: new Prisma.Decimal(params.amount),
            visitDate: params.visitDate ? new Date(params.visitDate) : null,
            message: params.message.trim(),
            status: QuoteStatus.PENDING,
          },
        });

    const updatedWallet = existingQuote
      ? await tx.wallet.findUnique({
          where: { userId: params.tradesmanId },
        })
      : await chargeCreditsForQuoteSubmission({
          userId: params.tradesmanId,
          quoteRequestId: quoteRequest.id,
          quoteId: savedQuote.id,
          tx,
          amount: QUOTE_SUBMISSION_CREDIT_COST,
        });

    return {
      quote: savedQuote,
      wallet: updatedWallet,
      wasCharged: !existingQuote,
    };
  });

  try {
    await createNotification({
      userId: quoteRequest.customerId,
      type: NotificationType.QUOTE_REQUEST,
      title: "새 견적이 도착했습니다",
      message: `${tradesman.fullName} 전문가가 ${quoteRequest.title} 요청에 견적을 보냈습니다.`,
      relatedId: quoteRequest.id,
      relatedType: NotificationRelatedType.QUOTE_REQUEST,
    });
  } catch (error) {
    // 견적 저장과 크레딧 차감은 이미 성공한 상태다.
    // 알림만 실패했다고 사용자에게 "견적 제출 실패"로 보이면 중복 재시도를 부를 수 있으므로,
    // 서버 로그만 남기고 견적 제출 자체는 성공으로 응답한다.
    console.error("QUOTE_NOTIFICATION_FAILED", error);
  }

  return {
    quote,
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
      tradesman: true,
      quoteRequest: true,
      booking: true,
    },
  });

  if (!quote) {
    throw new AppError("선택할 견적을 찾지 못했습니다.", 404);
  }

  if (quote.quoteRequest.customerId !== params.customerId) {
    throw new AppError("이 견적을 선택할 권한이 없습니다.", 403);
  }

  // 견적 선택은 "열려 있는 요청"에서만 허용한다.
  // 이미 매칭되거나 닫힌 요청을 다시 선택하게 두면 예약 흐름이 꼬이기 쉽다.
  if (quote.quoteRequest.status !== QuoteRequestStatus.OPEN) {
    throw new AppError("이미 닫힌 견적 요청이라 선택할 수 없습니다.", 400);
  }

  // 아직 대기 중인 견적만 선택 가능하게 제한한다.
  // 이미 수락/거절/철회된 견적을 다시 선택하면 상태 관리가 불안정해진다.
  if (quote.status !== QuoteStatus.PENDING) {
    throw new AppError("지금 상태의 견적은 선택할 수 없습니다.", 400);
  }

  if (
    quote.quoteRequest.selectedQuoteId &&
    quote.quoteRequest.selectedQuoteId !== quote.id
  ) {
    throw new AppError("이미 다른 견적이 선택된 요청입니다.", 400);
  }

  if (quote.booking) {
    const conversation = await getOrCreateConversationForBooking({
      bookingId: quote.booking.id,
      actorUserId: params.customerId,
    });

    return {
      bookingId: quote.booking.id,
      conversationId: conversation.id,
    };
  }

  const scheduledAt =
    quote.visitDate ??
    quote.quoteRequest.targetDate ??
    new Date(Date.now() + 24 * 60 * 60 * 1000);

  const bookingResult = await prisma.$transaction(async (tx) => {
    await tx.quoteRequest.update({
      where: { id: quote.quoteRequestId },
      data: {
        selectedQuoteId: quote.id,
        status: QuoteRequestStatus.MATCHED,
      },
    });

    await tx.quote.updateMany({
      where: {
        quoteRequestId: quote.quoteRequestId,
        id: {
          not: quote.id,
        },
      },
      data: {
        status: QuoteStatus.REJECTED,
      },
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.ACCEPTED,
      },
    });

    const booking = await tx.booking.create({
      data: {
        customerId: quote.quoteRequest.customerId,
        tradesmanId: quote.tradesmanId,
        quoteRequestId: quote.quoteRequestId,
        quoteId: quote.id,
        scheduledAt,
        finalAmount: quote.amount,
        workAddress: `${quote.quoteRequest.city}, ${quote.quoteRequest.addressLine}`,
        status: "PENDING",
      },
    });

    // 이미 견적 단계에서 같은 quoteId 대화방이 있을 수 있다.
    // 이 경우 새로 만들면 quoteId 유니크 충돌이 나므로,
    // 기존 대화방을 "예약이 연결된 작업 채팅방"으로 승격해서 재사용한다.
    const conversation = await tx.conversation.upsert({
      where: {
        quoteId: quote.id,
      },
      update: {
        customerId: quote.quoteRequest.customerId,
        tradesmanId: quote.tradesmanId,
        bookingId: booking.id,
        requestId: quote.quoteRequestId,
      },
      create: {
        customerId: quote.quoteRequest.customerId,
        tradesmanId: quote.tradesmanId,
        bookingId: booking.id,
        quoteId: quote.id,
        requestId: quote.quoteRequestId,
      },
    });

    // 예약 시작 시점에 필요한 시스템 메시지도 같은 트랜잭션 안에서 함께 남긴다.
    // 이렇게 해야 예약과 채팅방은 있는데 첫 메시지가 빠지는 어색한 상태를 막을 수 있다.
    await tx.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          senderRole: MessageSenderRole.SYSTEM,
          messageType: MessageType.SYSTEM,
          content: "고객이 이 견적을 선택했습니다.",
        },
        {
          conversationId: conversation.id,
          senderRole: MessageSenderRole.SYSTEM,
          messageType: MessageType.SYSTEM,
          content: "예약이 생성되었습니다.",
        },
      ],
    });

    return {
      bookingId: booking.id,
      conversationId: conversation.id,
    };
  });

  await createNotification({
    userId: quote.tradesmanId,
    type: NotificationType.BOOKING_CREATED,
    title: "고객이 견적을 선택했습니다",
    message: `${quote.quoteRequest.title} 요청이 예약으로 이어졌습니다.`,
    relatedId: bookingResult.bookingId,
    relatedType: NotificationRelatedType.BOOKING,
  });

  await createNotification({
    userId: quote.quoteRequest.customerId,
    type: NotificationType.BOOKING_CREATED,
    title: "예약이 생성되었습니다",
    message: `${quote.quoteRequest.title} 요청이 예약으로 확정되었습니다.`,
    relatedId: bookingResult.bookingId,
    relatedType: NotificationRelatedType.BOOKING,
  });

  return {
    bookingId: bookingResult.bookingId,
    conversationId: bookingResult.conversationId,
  };
}
