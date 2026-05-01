import { NotificationRelatedType, UserRole } from "@prisma/client";

import { getQuoteRequests } from "@/lib/constants/mock-data";
import { prisma } from "@/lib/prisma";
import type { Locale, QuoteRequestPreview } from "@/lib/types";

export interface ReceivedQuoteRequestsResult {
  items: QuoteRequestPreview[];
  source: "database" | "demo-fallback";
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

  return "예산 협의";
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
      const notifications = await prisma.notification.findMany({
        where: {
          userId: params.userId,
          relatedType: NotificationRelatedType.QUOTE_REQUEST,
          relatedId: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const requestIds = [...new Set(notifications.map((item) => item.relatedId).filter(Boolean))] as string[];

      if (requestIds.length > 0) {
        const requests = await prisma.quoteRequest.findMany({
          where: {
            id: {
              in: requestIds,
            },
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
    // DB가 잠깐 불안정할 때도 화면은 먼저 살려 두기 위해 조용히 fallback 한다.
  }

  return {
    source: "demo-fallback",
    items: getQuoteRequests(params.locale),
  };
}
