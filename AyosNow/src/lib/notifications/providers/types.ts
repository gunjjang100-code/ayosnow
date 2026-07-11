import type {
  Notification,
  NotificationChannel,
  NotificationRelatedType,
  NotificationType,
} from "@prisma/client";

export interface NotificationDispatchInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: NotificationRelatedType;
  channel: NotificationChannel;
}

export interface NotificationDispatchResult {
  channel: NotificationChannel;
  delivered: boolean;
  skippedReason?: string;
  notification?: Notification;
}
