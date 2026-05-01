import { NotificationChannel, type Notification } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { NotificationDispatchInput, NotificationDispatchResult } from "./types";

export async function sendInAppNotification(
  input: NotificationDispatchInput,
): Promise<NotificationDispatchResult> {
  // in-app 알림은 "앱 안쪽 우편함"이라고 생각하면 쉽다.
  // 그래서 실제 발송은 notifications 테이블에 저장하는 방식으로 처리한다.
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedId: input.relatedId,
      relatedType: input.relatedType,
      channel: NotificationChannel.IN_APP,
    },
  });

  return {
    channel: NotificationChannel.IN_APP,
    delivered: true,
    notification,
  };
}

export function isNotificationRecord(
  value: NotificationDispatchResult["notification"],
): value is Notification {
  return Boolean(value);
}
