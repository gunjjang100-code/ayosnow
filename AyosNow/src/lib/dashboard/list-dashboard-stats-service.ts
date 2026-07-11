import { BookingStatus, CreditTransactionType, QuoteRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { DashboardStat, Locale, UserRole } from "@/lib/types";

function formatMinutes(locale: Locale, minutes: number) {
  const rounded = Math.max(1, Math.round(minutes));

  if (locale === "fil") {
    return `${rounded} min`;
  }

  return `${rounded} min`;
}

function formatPhp(amount: number, locale: Locale) {
  const value = Math.round(amount);

  if (locale === "fil") {
    return `PHP ${value.toLocaleString("en-PH")}`;
  }

  return `PHP ${value.toLocaleString("en-US")}`;
}

function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function listDashboardStatsForUser(params: {
  sessionUserId: string;
  role: UserRole;
  locale: Locale;
}): Promise<DashboardStat[]> {
  if (params.role === "customer") {
    const [activeBookingsCount, receivedQuotesCount, quoteRequests] = await Promise.all([
      prisma.booking.count({
        where: {
          customerId: params.sessionUserId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS],
          },
        },
      }),
      prisma.quote.count({
        where: {
          quoteRequest: {
            customerId: params.sessionUserId,
          },
        },
      }),
      prisma.quoteRequest.findMany({
        where: {
          customerId: params.sessionUserId,
          status: {
            in: [QuoteRequestStatus.OPEN, QuoteRequestStatus.MATCHED, QuoteRequestStatus.CLOSED],
          },
        },
        select: {
          createdAt: true,
          quotes: {
            orderBy: {
              createdAt: "asc",
            },
            take: 1,
            select: {
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const responseSamples = quoteRequests
      .map((request) => {
        const firstQuote = request.quotes[0];
        if (!firstQuote) {
          return null;
        }

        return (
          (firstQuote.createdAt.getTime() - request.createdAt.getTime()) /
          (1000 * 60)
        );
      })
      .filter((value): value is number => value !== null && value >= 0);

    const averageResponseMinutes =
      responseSamples.length > 0
        ? responseSamples.reduce((sum, value) => sum + value, 0) / responseSamples.length
        : 0;

    return [
      {
        label: params.locale === "fil" ? "Aktibong booking" : "Active bookings",
        value: String(activeBookingsCount),
        helper:
          params.locale === "fil"
              ? "Ito ang bilang ng pending, accepted, at in-progress bookings ng kasalukuyang customer."
              : "This is the number of pending, accepted, and in-progress bookings for the current customer.",
      },
      {
        label: params.locale === "fil" ? "Natanggap na quote" : "Received quotes",
        value: String(receivedQuotesCount),
        helper:
          params.locale === "fil"
              ? "Kabuuan ito ng totoong quotes na dumating sa iyong mga request."
              : "This is the total number of real quotes received across your requests.",
      },
      {
        label: params.locale === "fil" ? "Average unang reply" : "Average first reply",
        value: averageResponseMinutes > 0 ? formatMinutes(params.locale, averageResponseMinutes) : "-",
        helper:
          params.locale === "fil"
              ? "Karaniwang oras mula paggawa ng request hanggang sa unang quote."
              : "Average time from request creation to the first quote arrival.",
      },
    ];
  }

  if (params.role === "tradesman") {
    const weekStart = getStartOfWeek();
    const [matchingOpenRequestsCount, bookingsThisWeekCount, quoteFeeAgg, wallet] = await Promise.all([
      prisma.quoteRequest.count({
        where: {
          status: QuoteRequestStatus.OPEN,
          category: {
            skillLinks: {
              some: {
                profile: {
                  userId: params.sessionUserId,
                },
              },
            },
          },
        },
      }),
      prisma.booking.count({
        where: {
          tradesmanId: params.sessionUserId,
          scheduledAt: {
            gte: weekStart,
          },
        },
      }),
      prisma.creditTransaction.aggregate({
        where: {
          userId: params.sessionUserId,
          type: CreditTransactionType.CHARGE,
          OR: [
            { referenceKey: { startsWith: `quote-fee:${params.sessionUserId}:` } },
            { referenceKey: { startsWith: "quote-charge:" } },
          ],
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.wallet.findUnique({
        where: {
          userId: params.sessionUserId,
        },
        select: {
          balance: true,
        },
      }),
    ]);

    const quoteFeesPaid = Number(quoteFeeAgg._sum.amount ?? 0);
    const creditBalance = Number(wallet?.balance ?? 0);

    return [
      {
        label: "Current credits",
        value: formatPhp(creditBalance, params.locale),
        helper:
          params.locale === "fil"
              ? "Mababawas dito ang 40 PHP bawat pagpapadala ng quote."
              : "Each quote submission deducts 40 PHP from this balance.",
      },
      {
        label: params.locale === "fil" ? "Bagong quote request" : "New quote requests",
        value: String(matchingOpenRequestsCount),
        helper:
          params.locale === "fil"
              ? "Bilang ito ng OPEN requests na tugma sa iyong skill categories."
              : "This is the number of OPEN requests matching your skill categories.",
      },
      {
        label: params.locale === "fil" ? "Bookings ngayong linggo" : "Bookings this week",
        value: String(bookingsThisWeekCount),
        helper:
          params.locale === "fil"
              ? "Bilang ito ng bookings na naka-schedule ngayong linggo."
              : "This is the number of bookings scheduled for this week.",
      },
      {
        label: params.locale === "fil" ? "Kabuuang quote fees" : "Total quote fees",
        value: formatPhp(quoteFeesPaid, params.locale),
        helper:
          params.locale === "fil"
              ? "Kabuuang 40 PHP fees na nabawas noong unang pagpapadala ng quote."
              : "Total 40 PHP fees deducted on first quote submissions.",
      },
    ];
  }

  const [activeBookingsCount, openQuoteRequestsCount, openDisputesCount] = await Promise.all([
    prisma.booking.count({
      where: {
        status: {
          in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS],
        },
      },
    }),
    prisma.quoteRequest.count({
      where: {
        status: QuoteRequestStatus.OPEN,
      },
    }),
    prisma.dispute.count({
      where: {
        status: {
          in: ["OPEN", "UNDER_REVIEW"],
        },
      },
    }),
  ]);

  return [
    {
      label: params.locale === "fil" ? "Aktibong booking" : "Active bookings",
      value: String(activeBookingsCount),
      helper:
        params.locale === "fil"
            ? "Kabuuang bilang ng active bookings sa buong platform."
            : "Total active bookings across the platform.",
    },
    {
      label: "Open quote requests",
      value: String(openQuoteRequestsCount),
      helper:
        params.locale === "fil"
            ? "Bilang ito ng requests na hindi pa tapos ang matching."
            : "This is the number of requests still waiting for matching.",
    },
    {
      label: "Open disputes",
      value: String(openDisputesCount),
      helper:
        params.locale === "fil"
            ? "Bilang ito ng disputes na kailangan pa ng admin review."
            : "This is the number of disputes that still need admin review.",
    },
  ];
}
