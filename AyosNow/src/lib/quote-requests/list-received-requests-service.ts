import { QuoteRequestStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getTradesmanVerificationState } from "@/lib/tradesmen/verification-service";
import type { Locale, QuoteRequestPreview } from "@/lib/types";

export interface ReceivedQuoteRequestsResult {
  items: QuoteRequestPreview[];
  source: "database";
  emptyReason?: "unverified" | "no-skills" | "no-matching-requests";
}

function formatBudgetLabel(min: string | null, max: string | null) {
  if (min && max) {
    return `PHP ${min} ~ ${max}`;
  }

  if (min) {
    return `PHP ${min}+`;
  }

  if (max) {
    return `Up to PHP ${max}`;
  }

  return "Budget flexible";
}

function formatTargetDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function mapStatus(status: string): QuoteRequestPreview["status"] {
  if (status === "MATCHED") {
    return "matched";
  }

  if (status === "CLOSED" || status === "CANCELLED") {
    return "closed";
  }

  return "open";
}

export async function listReceivedQuoteRequestsForWorkspace(params: {
  userId: string;
  role: UserRole;
  locale: Locale;
}): Promise<ReceivedQuoteRequestsResult> {
  try {
    if (params.role === "TRADESMAN") {
      const verification = await getTradesmanVerificationState(params.userId);
      if (!verification.isVerified) {
        return {
          source: "database",
          items: [],
          emptyReason: "unverified",
        };
      }

      const skillLinks = await prisma.tradesmanSkill.findMany({
        where: {
          profile: {
            userId: params.userId,
          },
        },
        select: {
          categoryId: true,
        },
      });

      const categoryIds = [...new Set(skillLinks.map((skillLink) => skillLink.categoryId))];

      if (categoryIds.length === 0) {
        return {
          source: "database",
          items: [],
          emptyReason: "no-skills",
        };
      }

      if (categoryIds.length > 0) {
        const requests = await prisma.quoteRequest.findMany({
          where: {
            categoryId: {
              in: categoryIds,
            },
            status: QuoteRequestStatus.OPEN,
          },
          include: {
            quotes: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (requests.length > 0) {
          return {
            source: "database",
            items: requests.map((request) => ({
              id: request.id,
              serviceName: request.title,
              location: request.city,
              budgetLabel: formatBudgetLabel(
                request.budgetMin?.toString() ?? null,
                request.budgetMax?.toString() ?? null,
              ),
              targetDate: formatTargetDate(request.targetDate),
              summary: request.description,
              bidsCount: request.quotes.length,
              status: mapStatus(request.status),
            })),
          };
        }
      }

      return {
        source: "database",
        items: [],
        emptyReason: "no-matching-requests",
      };
    }

    if (params.role === "ADMIN") {
      const requests = await prisma.quoteRequest.findMany({
        include: {
          quotes: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      if (requests.length > 0) {
        return {
          source: "database",
          items: requests.map((request) => ({
            id: request.id,
            serviceName: request.title,
            location: request.city,
            budgetLabel: formatBudgetLabel(
              request.budgetMin?.toString() ?? null,
              request.budgetMax?.toString() ?? null,
            ),
            targetDate: formatTargetDate(request.targetDate),
            summary: request.description,
            bidsCount: request.quotes.length,
            status: mapStatus(request.status),
          })),
        };
      }
    }
  } catch {
    // 운영형 화면에서는 예시 요청을 섞지 않는다.
    // DB 오류가 나면 빈 목록을 반환하고, 실제 오류 감지는 서버 로그/모니터링에서 처리한다.
  }

  return {
    source: "database",
    items: [],
  };
}
