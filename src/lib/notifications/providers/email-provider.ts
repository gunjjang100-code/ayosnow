import { NotificationChannel } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { NotificationDispatchInput, NotificationDispatchResult } from "./types";

export async function sendEmailNotification(
  input: NotificationDispatchInput,
): Promise<NotificationDispatchResult> {
  // 지금은 실제 이메일 발송사 연결이 없다.
  // 대신 "이 채널로 보낼 준비까지는 끝났다"는 기록을 남겨서 흐름을 검수할 수 있게 만든다.
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: `[EMAIL] ${input.title}`,
      message: input.message,
      relatedId: input.relatedId,
      relatedType: input.relatedType,
      channel: NotificationChannel.EMAIL,
      isRead: true,
      readAt: new Date(),
    },
  });

  return {
    channel: NotificationChannel.EMAIL,
    delivered: true,
    notification,
  };
}
