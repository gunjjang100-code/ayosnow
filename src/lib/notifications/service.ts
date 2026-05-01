import {
  NotificationChannel,
  NotificationRelatedType,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { dispatchNotification } from "./providers";
import { isNotificationRecord } from "./providers/in-app-provider";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: NotificationRelatedType;
  channels?: NotificationChannel[];
}

export interface NotificationListItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId: string | null;
  relatedType: NotificationRelatedType | null;
  href: string;
  type: NotificationType;
  channel: NotificationChannel;
}

function getUniqueChannels(
  channels: NotificationChannel[] | undefined,
): NotificationChannel[] {
  if (!channels || channels.length === 0) {
    return [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
      NotificationChannel.PUSH,
      NotificationChannel.SMS,
    ];
  }

  return [...new Set(channels)];
}

export async function createNotification(params: CreateNotificationParams) {
  // 알림 생성은 "한 장의 편지를 만들고, 어느 통로로 보낼지 정하는 일"이다.
  // 지금은 in-app만 실제 보관함에 저장하고, 나머지 채널은 확장 자리만 만들어 둔다.
  const results = await Promise.all(
    getUniqueChannels(params.channels).map((channel) =>
      dispatchNotification({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedId: params.relatedId,
        relatedType: params.relatedType,
        channel,
      }),
    ),
  );

  return results.filter((result) => isNotificationRecord(result.notification));
}

export async function createNotifications(paramsList: CreateNotificationParams[]) {
  const results = await Promise.all(
    paramsList.map((params) => createNotification(params)),
  );

  return results.flat();
}

function getNotificationHref(
  relatedType: NotificationRelatedType | null,
  relatedId: string | null,
): string {
  if (!relatedType || !relatedId) {
    return "/dashboard";
  }

  if (relatedType === NotificationRelatedType.BOOKING) {
    return `/bookings/${relatedId}`;
  }

  return `/quote-requests/${relatedId}`;
}

function toNotificationListItem(notification: {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedId: string | null;
  relatedType: NotificationRelatedType | null;
  type: NotificationType;
  channel: NotificationChannel;
}): NotificationListItem {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    relatedId: notification.relatedId,
    relatedType: notification.relatedType,
    href: getNotificationHref(notification.relatedType, notification.relatedId),
    type: notification.type,
    channel: notification.channel,
  };
}

export async function listNotificationsForUser(userId: string, limit = 20) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      channel: NotificationChannel.IN_APP,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return notifications.map(toNotificationListItem);
}

export async function countUnreadNotificationsForUser(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      channel: NotificationChannel.IN_APP,
      isRead: false,
    },
  });
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
      channel: NotificationChannel.IN_APP,
    },
  });

  if (!notification) {
    return null;
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return toNotificationListItem(updated);
}

export async function markAllNotificationsAsRead(userId: string) {
  const now = new Date();

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      channel: NotificationChannel.IN_APP,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: now,
    },
  });

  return result.count;
}

export function toMoneyDecimal(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return new Prisma.Decimal(value);
}
