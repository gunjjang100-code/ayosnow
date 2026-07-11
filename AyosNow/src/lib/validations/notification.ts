import { NotificationChannel, NotificationRelatedType, NotificationType } from "@prisma/client";
import { z } from "zod";

export const createNotificationSchema = z.object({
  targetUserId: z.string().trim().min(1, "Notification target user is required."),
  type: z.nativeEnum(NotificationType),
  title: z.string().trim().min(2, "Notification title must be at least 2 characters.").max(120),
  message: z.string().trim().min(5, "Notification message must be at least 5 characters.").max(500),
  relatedId: z.string().trim().min(1).max(100).optional(),
  relatedType: z.nativeEnum(NotificationRelatedType).optional(),
  channels: z
    .array(z.nativeEnum(NotificationChannel))
    .min(1, "At least one channel is required.")
    .optional(),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().trim().min(1, "Notification ID is required to mark it as read."),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
