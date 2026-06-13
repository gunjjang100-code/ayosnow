import {
  NotificationRelatedType,
  NotificationType,
  QuoteRequestStatus,
  UserRole,
  AccountStatus,
} from "@prisma/client";

import type { QuoteRequestInput } from "@/lib/validations/quote-request";
import { AppError } from "@/lib/errors/app-error";
import { createNotifications, toMoneyDecimal } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";

async function ensureQuoteRequestCategory(input: QuoteRequestInput) {
  const existingCategory = await prisma.serviceCategory.findUnique({
    where: { slug: input.categorySlug },
  });

  if (!existingCategory || !existingCategory.isActive) {
    // 고객이 보낸 categorySlug를 그대로 믿으면 안 된다.
    // 메뉴판에 없는 음식을 주문받지 않는 것처럼, DB에 있고 활성화된 카테고리만 받는다.
    throw new AppError("선택한 서비스 카테고리를 사용할 수 없습니다.", 400);
  }

  return existingCategory;
}

export async function createQuoteRequest(params: {
  customerId: string;
  input: QuoteRequestInput;
}) {
  const category = await ensureQuoteRequestCategory(params.input);

  if (!category) {
    throw new AppError("견적 요청 카테고리를 준비하지 못했습니다.", 400);
  }

  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      customerId: params.customerId,
      categoryId: category.id,
      title: params.input.title,
      description: params.input.description,
      city: params.input.city,
      addressLine: params.input.addressLine,
      budgetMin: toMoneyDecimal(params.input.budgetMin),
      budgetMax: toMoneyDecimal(params.input.budgetMax),
      targetDate: params.input.targetDate ? new Date(params.input.targetDate) : undefined,
      status: QuoteRequestStatus.OPEN,
    },
    include: {
      category: true,
    },
  });

  // 가장 먼저 같은 도시 + 같은 기술을 가진 전문가를 찾는다.
  // 가까운 전문가가 없으면 같은 기술을 가진 전문가까지 넓혀 알림이 끊기지 않게 한다.
  const exactCityMatches = await prisma.tradesmanSkill.findMany({
    where: {
      categoryId: category.id,
      profile: {
        user: {
          role: UserRole.TRADESMAN,
          status: AccountStatus.ACTIVE,
          city: params.input.city,
        },
      },
    },
    include: {
      profile: {
        include: {
          user: true,
        },
      },
    },
  });

  const fallbackMatches =
    exactCityMatches.length > 0
      ? exactCityMatches
      : await prisma.tradesmanSkill.findMany({
          where: {
            categoryId: category.id,
            profile: {
              user: {
                role: UserRole.TRADESMAN,
                status: AccountStatus.ACTIVE,
              },
            },
          },
          include: {
            profile: {
              include: {
                user: true,
              },
            },
          },
        });

  const uniqueTradesmen = [
    ...new Map(
      fallbackMatches.map((skillLink) => [skillLink.profile.userId, skillLink.profile.user]),
    ).values(),
  ];

  await createNotifications(
    uniqueTradesmen.map((tradesman) => ({
      userId: tradesman.id,
      type: NotificationType.QUOTE_REQUEST,
      title: "새 견적 요청이 도착했습니다",
      message: `${quoteRequest.category.name} 카테고리의 새 견적 요청이 등록되었습니다.`,
      relatedId: quoteRequest.id,
      relatedType: NotificationRelatedType.QUOTE_REQUEST,
    })),
  );

  return {
    quoteRequest,
    matchedTradesmenCount: uniqueTradesmen.length,
  };
}
