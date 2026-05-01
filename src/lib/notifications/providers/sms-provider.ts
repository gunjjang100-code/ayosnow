import { NotificationChannel } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { NotificationDispatchInput, NotificationDispatchResult } from "./types";

export async function sendSmsNotification(
  input: NotificationDispatchInput,
): Promise<NotificationDispatchResult> {
  // SMS도 현재는 모의 발송 기록으로 처리한다.
  // 실제 발송사를 붙이면 여기만 바꾸면 되도록 분리해 둔다.
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: `[SMS] ${input.title}`,
      message: input.message,
      relatedId: input.relatedId,
      relatedType: input.relatedType,
      channel: NotificationChannel.SMS,
      isRead: true,
      readAt: new Date(),
    },
  });

  return {
    channel: NotificationChannel.SMS,
    delivered: true,
    notification,
  };
}
