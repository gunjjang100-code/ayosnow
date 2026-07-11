import { NotificationRelatedType } from "@prisma/client";

export interface NotificationRelatedTargetInput {
  relatedId: string | null;
  relatedType: NotificationRelatedType | null;
}

export interface NotificationRelatedTargetSets {
  bookingIds: ReadonlySet<string>;
  quoteRequestIds: ReadonlySet<string>;
}

export function shouldShowNotificationForExistingTarget(
  notification: NotificationRelatedTargetInput,
  targets: NotificationRelatedTargetSets,
) {
  // 알림은 편지, relatedId는 편지가 가리키는 방 번호라고 보면 된다.
  // 방이 이미 사라졌다면 사용자를 404로 보내지 않도록 목록에서 숨긴다.
  if (!notification.relatedId || !notification.relatedType) {
    return true;
  }

  if (notification.relatedType === NotificationRelatedType.BOOKING) {
    return targets.bookingIds.has(notification.relatedId);
  }

  if (notification.relatedType === NotificationRelatedType.QUOTE_REQUEST) {
    return targets.quoteRequestIds.has(notification.relatedId);
  }

  return true;
}
