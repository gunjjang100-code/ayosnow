import { UserRole } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";
import type {
  Locale,
  TradesmanAvailabilityItem,
  UserRole as AppUserRole,
} from "@/lib/types";
import { tradesmanAvailabilityUpdateSchema } from "@/lib/validations/availability";

type AvailabilityInput = Omit<TradesmanAvailabilityItem, "dayLabel">;

const DAYS = [
  { en: "Sunday", fil: "Linggo" },
  { en: "Monday", fil: "Lunes" },
  { en: "Tuesday", fil: "Martes" },
  { en: "Wednesday", fil: "Miyerkules" },
  { en: "Thursday", fil: "Huwebes" },
  { en: "Friday", fil: "Biyernes" },
  { en: "Saturday", fil: "Sabado" },
] as const;

function getDefaultAvailability(): AvailabilityInput[] {
  return DAYS.map((_, dayOfWeek) => ({
    dayOfWeek,
    isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5,
    startTime: "09:00",
    endTime: "18:00",
  }));
}

function getDayLabel(dayOfWeek: number, locale: Locale) {
  const day = DAYS[dayOfWeek] ?? DAYS[0];
  return locale === "fil" ? day.fil : day.en;
}

function toAvailabilityItem(
  value: AvailabilityInput,
  locale: Locale,
): TradesmanAvailabilityItem {
  return {
    ...value,
    dayLabel: getDayLabel(value.dayOfWeek, locale),
  };
}

function assertTradesman(role: AppUserRole) {
  if (role !== "tradesman") {
    throw new AppError("Only professional accounts can manage availability.", 403);
  }
}

async function assertTradesmanAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });

  if (!user || user.role !== UserRole.TRADESMAN) {
    throw new AppError("Only professional accounts can manage availability.", 403);
  }
}

export async function listTradesmanAvailability(params: {
  userId: string;
  role: AppUserRole;
  locale: Locale;
}) {
  assertTradesman(params.role);
  await assertTradesmanAccount(params.userId);

  const savedItems = await prisma.tradesmanAvailability.findMany({
    where: { userId: params.userId },
    orderBy: { dayOfWeek: "asc" },
    select: {
      dayOfWeek: true,
      isAvailable: true,
      startTime: true,
      endTime: true,
    },
  });

  const savedByDay = new Map(savedItems.map((item) => [item.dayOfWeek, item]));

  return getDefaultAvailability().map((defaultItem) =>
    toAvailabilityItem(
      {
        ...defaultItem,
        ...savedByDay.get(defaultItem.dayOfWeek),
      },
      params.locale,
    ),
  );
}

export async function updateTradesmanAvailability(params: {
  userId: string;
  role: AppUserRole;
  locale: Locale;
  availability: AvailabilityInput[];
}) {
  assertTradesman(params.role);
  await assertTradesmanAccount(params.userId);

  const parsed = tradesmanAvailabilityUpdateSchema.safeParse({
    availability: params.availability,
  });

  if (!parsed.success) {
    throw new AppError("Please check the availability times and try again.", 400);
  }

  await prisma.$transaction(
    parsed.data.availability.map((item) =>
      prisma.tradesmanAvailability.upsert({
        where: {
          userId_dayOfWeek: {
            userId: params.userId,
            dayOfWeek: item.dayOfWeek,
          },
        },
        create: {
          userId: params.userId,
          dayOfWeek: item.dayOfWeek,
          isAvailable: item.isAvailable,
          startTime: item.startTime,
          endTime: item.endTime,
        },
        update: {
          isAvailable: item.isAvailable,
          startTime: item.startTime,
          endTime: item.endTime,
        },
      }),
    ),
  );

  return listTradesmanAvailability({
    userId: params.userId,
    role: params.role,
    locale: params.locale,
  });
}
