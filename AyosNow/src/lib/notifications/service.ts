import {
  NotificationChannel,
  NotificationRelatedType,
  NotificationType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { normalizeLegacyNotificationText } from "./legacy-text";
import { dispatchNotification } from "./providers";
import { isNotificationRecord } from "./providers/in-app-provider";
import {
  shouldShowNotificationForExistingTarget,
  type NotificationRelatedTargetSets,
} from "./related-targets";

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
  // 우편함 저장(IN_APP)은 핵심 기능이고, 푸시/이메일/SMS는 보조 발송이다.
  // 보조 발송이 실패해도 예약/견적 같은 원래 작업까지 무너지면 안 되므로 채널별로 분리한다.
  const results = await Promise.all(
    getUniqueChannels(params.channels).map(async (channel) => {
      try {
        return await dispatchNotification({
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          relatedId: params.relatedId,
          relatedType: params.relatedType,
          channel,
        });
      } catch (error) {
        console.error("Notification dispatch failed", {
          channel,
          userId: params.userId,
          type: params.type,
          error,
        });

        return {
          channel,
          delivered: false,
          skippedReason: "Notification channel failed.",
        };
      }
    }),
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
  const normalizedText = normalizeLegacyNotificationText(notification);

  return {
    id: notification.id,
    title: normalizedText.title,
    message: normalizedText.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    relatedId: notification.relatedId,
    relatedType: notification.relatedType,
    href: getNotificationHref(notification.relatedType, notification.relatedId),
    type: notification.type,
    channel: notification.channel,
  };
}

async function getExistingRelatedTargets(
  notifications: Array<{
    relatedId: string | null;
    relatedType: NotificationRelatedType | null;
  }>,
): Promise<NotificationRelatedTargetSets> {
  const quoteRequestIds = notifications
    .filter(
      (
        notification,
      ): notification is {
        relatedId: string;
        relatedType: NotificationRelatedType;
      } =>
        notification.relatedType === NotificationRelatedType.QUOTE_REQUEST &&
        Boolean(notification.relatedId),
    )
    .map((notification) => notification.relatedId);

  const bookingIds = notifications
    .filter(
      (
        notification,
      ): notification is {
        relatedId: string;
        relatedType: NotificationRelatedType;
      } =>
        notification.relatedType === NotificationRelatedType.BOOKING &&
        Boolean(notification.relatedId),
    )
    .map((notification) => notification.relatedId);

  const [quoteRequests, bookings] = await Promise.all([
    quoteRequestIds.length > 0
      ? prisma.quoteRequest.findMany({
          where: { id: { in: [...new Set(quoteRequestIds)] } },
          select: { id: true },
        })
      : [],
    bookingIds.length > 0
      ? prisma.booking.findMany({
          where: { id: { in: [...new Set(bookingIds)] } },
          select: { id: true },
        })
      : [],
  ]);

  return {
    quoteRequestIds: new Set(quoteRequests.map((quoteRequest) => quoteRequest.id)),
    bookingIds: new Set(bookings.map((booking) => booking.id)),
  };
}

export async function listNotificationsForUser(userId: string, limit = 20) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      channel: NotificationChannel.IN_APP,
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit * 3, limit), 60),
  });

  const existingTargets = await getExistingRelatedTargets(notifications);

  return notifications
    .filter((notification) =>
      shouldShowNotificationForExistingTarget(notification, existingTargets),
    )
    .slice(0, limit)
    .map(toNotificationListItem);
}

export async function countUnreadNotificationsForUser(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      channel: NotificationChannel.IN_APP,
      isRead: false,
    },
    select: {
      relatedId: true,
      relatedType: true,
    },
  });

  const existingTargets = await getExistingRelatedTargets(notifications);

  return notifications.filter((notification) =>
    shouldShowNotificationForExistingTarget(notification, existingTargets),
  ).length;
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

export function toMoneyValue(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return Math.round(value);
}
