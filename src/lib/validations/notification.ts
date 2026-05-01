import { NotificationChannel, NotificationRelatedType, NotificationType } from "@prisma/client";
import { z } from "zod";

export const createNotificationSchema = z.object({
  targetUserId: z.string().trim().min(1, "알림 대상 사용자가 필요합니다."),
  type: z.nativeEnum(NotificationType),
  title: z.string().trim().min(2, "알림 제목은 2자 이상이어야 합니다.").max(120),
  message: z.string().trim().min(5, "알림 내용은 5자 이상이어야 합니다.").max(500),
  relatedId: z.string().trim().min(1).max(100).optional(),
  relatedType: z.nativeEnum(NotificationRelatedType).optional(),
  channels: z
    .array(z.nativeEnum(NotificationChannel))
    .min(1, "최소 한 개 이상의 채널이 필요합니다.")
    .optional(),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().trim().min(1, "읽음 처리할 알림 ID가 필요합니다."),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
