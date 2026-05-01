import {
  NotificationRelatedType,
  NotificationType,
  QuoteRequestStatus,
  UserRole,
  AccountStatus,
} from "@prisma/client";

import type { QuoteRequestInput } from "@/lib/validations/quote-request";
import { AppError } from "@/lib/errors/app-error";
import { ensureDemoData } from "@/lib/demo/demo-data";
import { createNotifications, toMoneyDecimal } from "@/lib/notifications/service";
import { prisma } from "@/lib/prisma";

function buildCategoryNameFromSlug(slug: string) {
  // 관리자 로컬 카테고리처럼 DB에 아직 없는 slug가 들어와도
  // 요청서가 막히지 않도록, 읽기 쉬운 기본 이름을 만들어 준다.
  if (!slug.trim()) {
    return "기타 서비스";
  }

  if (/^[a-z0-9-_ ]+$/i.test(slug)) {
    return slug
      .split(/[-_ ]+/)
      .filter(Boolean)
      .map((word) => (word.toLowerCase() === "cctv" ? "CCTV" : `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`))
      .join(" ");
  }

  return slug;
}

async function ensureQuoteRequestCategory(input: QuoteRequestInput) {
  const existingCategory = await prisma.serviceCategory.findUnique({
    where: { slug: input.categorySlug },
  });

  if (existingCategory) {
    // 보이는 카테고리에서 선택한 값이라면 inactive여도 우선 요청은 받는다.
    // 지금 단계에서는 요청이 막히는 것보다 저장되는 쪽이 더 실용적이다.
    return existingCategory;
  }

  return prisma.serviceCategory.create({
    data: {
      slug: input.categorySlug,
      name: buildCategoryNameFromSlug(input.categorySlug),
      description: "고객 요청에서 자동으로 생성된 서비스 카테고리입니다.",
      isActive: true,
    },
  });
}

export async function createQuoteRequest(params: {
  customerId: string;
  input: QuoteRequestInput;
}) {
  await ensureDemoData();

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
  // 없으면 같은 기술만 맞는 전문가까지 넓혀서 MVP에서도 알림이 끊기지 않게 한다.
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
