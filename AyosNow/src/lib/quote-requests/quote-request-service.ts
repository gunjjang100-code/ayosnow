import {
  NotificationChannel,
  NotificationRelatedType,
  NotificationType,
  QuoteRequestStatus,
  UserRole,
  AccountStatus,
} from "@prisma/client";

import type { QuoteRequestInput } from "@/lib/validations/quote-request";
import { appendSystemMessageToConversation } from "@/lib/chat/service";
import { AppError } from "@/lib/errors/app-error";
import { createNotifications, toMoneyValue } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";
import { canCustomerChangeQuoteRequest } from "./quote-request-policy";

const MAX_QUOTE_REQUEST_NOTIFICATION_RECIPIENTS = 25;

async function ensureQuoteRequestCategory(input: QuoteRequestInput) {
  const existingCategory = await prisma.serviceCategory.findUnique({
    where: { slug: input.categorySlug },
  });

  if (!existingCategory || !existingCategory.isActive) {
    // 고객이 보낸 categorySlug를 그대로 믿으면 안 된다.
    // 메뉴판에 없는 음식을 주문받지 않는 것처럼, DB에 있고 활성화된 카테고리만 받는다.
    throw new AppError("The selected service category is not available.", 400);
  }

  return existingCategory;
}

export async function createQuoteRequest(params: {
  customerId: string;
  input: QuoteRequestInput;
}) {
  const category = await ensureQuoteRequestCategory(params.input);

  if (!category) {
    throw new AppError("Could not prepare the quote request category.", 400);
  }

  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      customerId: params.customerId,
      categoryId: category.id,
      title: params.input.title,
      description: params.input.description,
      city: params.input.city,
      addressLine: params.input.addressLine,
      budgetMin: toMoneyValue(params.input.budgetMin),
      budgetMax: toMoneyValue(params.input.budgetMax),
      targetDate: params.input.targetDate ? new Date(params.input.targetDate) : undefined,
      status: QuoteRequestStatus.OPEN,
    },
    include: {
      category: true,
    },
  });

  // 가장 먼저 같은 도시 + 같은 기술을 가진 전문가를 찾는다.
  // 전문가 계정이 많아져도 Worker가 한 번에 너무 많은 일을 하지 않도록 발송 대상을 제한한다.
  const exactCityMatches = await prisma.tradesmanSkill.findMany({
    where: {
      categoryId: category.id,
      profile: {
        isVerified: true,
        user: {
          role: UserRole.TRADESMAN,
          status: AccountStatus.ACTIVE,
          city: params.input.city,
        },
      },
    },
    select: {
      profile: {
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    take: MAX_QUOTE_REQUEST_NOTIFICATION_RECIPIENTS,
  });

  const fallbackMatches =
    exactCityMatches.length > 0
      ? exactCityMatches
      : await prisma.tradesmanSkill.findMany({
          where: {
            categoryId: category.id,
            profile: {
              isVerified: true,
              user: {
                role: UserRole.TRADESMAN,
                status: AccountStatus.ACTIVE,
              },
            },
          },
          select: {
            profile: {
              select: {
                user: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
          take: MAX_QUOTE_REQUEST_NOTIFICATION_RECIPIENTS,
        });

  const uniqueTradesmen = [
    ...new Map(
      fallbackMatches.map((skillLink) => [skillLink.profile.user.id, skillLink.profile.user]),
    ).values(),
  ].slice(0, MAX_QUOTE_REQUEST_NOTIFICATION_RECIPIENTS);

  try {
    await createNotifications(
      uniqueTradesmen.map((tradesman) => ({
        userId: tradesman.id,
        type: NotificationType.QUOTE_REQUEST,
        title: "New quote request received",
        message: `A new quote request was posted in ${quoteRequest.category.name}.`,
        relatedId: quoteRequest.id,
        relatedType: NotificationRelatedType.QUOTE_REQUEST,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      })),
    );
  } catch (error) {
    // 요청 저장은 이미 성공했다.
    // 알림만 실패했는데 전체 요청을 실패로 보이면 고객이 다시 제출해서 중복 요청이 생길 수 있다.
    console.error("QUOTE_REQUEST_NOTIFICATION_FAILED", error);
  }

  return {
    quoteRequest,
    matchedTradesmenCount: uniqueTradesmen.length,
  };
}

async function getCustomerOpenQuoteRequest(params: {
  quoteRequestId: string;
  customerId: string;
}) {
  const quoteRequest = await prisma.quoteRequest.findUnique({
    where: { id: params.quoteRequestId },
  });

  if (!quoteRequest) {
    throw new AppError("Could not find the target quote request.", 404);
  }

  if (quoteRequest.customerId !== params.customerId) {
    throw new AppError("You do not have permission to update this request.", 403);
  }

  // 고객 요청은 OPEN 상태일 때만 고칠 수 있다.
  // 이미 매칭되거나 닫힌 요청은 택배가 이미 출발한 주문처럼 중간에 바꾸면 기록이 꼬인다.
  if (!canCustomerChangeQuoteRequest(quoteRequest.status)) {
    throw new AppError("Only open quote requests can be changed.", 400);
  }

  return quoteRequest;
}

export async function updateQuoteRequestForCustomer(params: {
  quoteRequestId: string;
  customerId: string;
  input: QuoteRequestInput;
}) {
  await getCustomerOpenQuoteRequest({
    quoteRequestId: params.quoteRequestId,
    customerId: params.customerId,
  });

  const category = await ensureQuoteRequestCategory(params.input);

  const updateResult = await prisma.quoteRequest.updateMany({
    where: {
      id: params.quoteRequestId,
      customerId: params.customerId,
      status: QuoteRequestStatus.OPEN,
    },
    data: {
      categoryId: category.id,
      title: params.input.title,
      description: params.input.description,
      city: params.input.city,
      addressLine: params.input.addressLine,
      budgetMin: toMoneyValue(params.input.budgetMin),
      budgetMax: toMoneyValue(params.input.budgetMax),
      targetDate: params.input.targetDate ? new Date(params.input.targetDate) : null,
    },
  });

  if (updateResult.count !== 1) {
    throw new AppError("This request changed while you were editing. Please refresh and try again.", 409);
  }

  const updatedRequest = await prisma.quoteRequest.findUnique({
    where: { id: params.quoteRequestId },
    include: {
      category: true,
    },
  });

  if (!updatedRequest) {
    throw new AppError("Could not find the updated quote request.", 404);
  }

  return updatedRequest;
}

export async function cancelQuoteRequestForCustomer(params: {
  quoteRequestId: string;
  customerId: string;
}) {
  const quoteRequest = await getCustomerOpenQuoteRequest({
    quoteRequestId: params.quoteRequestId,
    customerId: params.customerId,
  });

  const updateResult = await prisma.quoteRequest.updateMany({
    where: {
      id: quoteRequest.id,
      customerId: params.customerId,
      status: QuoteRequestStatus.OPEN,
    },
    data: {
      status: QuoteRequestStatus.CANCELLED,
    },
  });

  if (updateResult.count !== 1) {
    throw new AppError("This request changed before it could be cancelled. Please refresh and try again.", 409);
  }

  const cancelledRequest = await prisma.quoteRequest.findUnique({
    where: { id: quoteRequest.id },
  });

  if (!cancelledRequest) {
    throw new AppError("Could not find the cancelled quote request.", 404);
  }

  const relatedTradesmanIds = await prisma.quote.findMany({
    where: {
      quoteRequestId: quoteRequest.id,
    },
    select: {
      tradesmanId: true,
    },
    distinct: ["tradesmanId"],
  });

  try {
    await createNotifications(
      relatedTradesmanIds.map(({ tradesmanId }) => ({
        userId: tradesmanId,
        type: NotificationType.QUOTE_REQUEST,
        title: "Quote request cancelled",
        message: "The customer cancelled this quote request.",
        relatedId: quoteRequest.id,
        relatedType: NotificationRelatedType.QUOTE_REQUEST,
      })),
    );
  } catch (error) {
    // 취소 상태 저장은 이미 성공했다.
    // 알림 실패만으로 취소 실패처럼 보이지 않게 해서 중복 클릭을 막는다.
    console.error("QUOTE_REQUEST_CANCEL_NOTIFICATION_FAILED", error);
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      requestId: quoteRequest.id,
    },
    select: {
      id: true,
    },
  });

  try {
    await Promise.all(
      conversations.map((conversation) =>
        appendSystemMessageToConversation({
          conversationId: conversation.id,
          content: "Quote request cancelled.",
        }),
      ),
    );
  } catch (error) {
    // 채팅 안내 메시지는 보조 기록이다. 취소 자체는 되돌리지 않는다.
    console.error("QUOTE_REQUEST_CANCEL_CHAT_NOTICE_FAILED", error);
  }

  return cancelledRequest;
}
