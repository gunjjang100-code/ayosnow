import { NotificationChannel, NotificationRelatedType } from "@prisma/client";

import { removePushSubscriptionByEndpoint } from "@/lib/notifications/push-subscription-service";
import { prisma } from "@/lib/prisma";
import { getConfiguredWebPush } from "@/lib/push/web-push";

import type { NotificationDispatchInput, NotificationDispatchResult } from "./types";

export async function sendPushNotification(
  input: NotificationDispatchInput,
): Promise<NotificationDispatchResult> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: input.userId,
    },
  });

  if (subscriptions.length === 0) {
    return {
      channel: NotificationChannel.PUSH,
      delivered: false,
      skippedReason: "No browser push subscription is available yet.",
    };
  }

  const webpush = getConfiguredWebPush();
  const payload = JSON.stringify({
    title: input.title,
    body: input.message,
    url:
      input.relatedType === NotificationRelatedType.BOOKING
        ? `/bookings/${input.relatedId ?? ""}`
        : input.relatedType === NotificationRelatedType.QUOTE_REQUEST
          ? `/quote-requests/${input.relatedId ?? ""}`
          : "/dashboard",
  });

  let deliveredCount = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        deliveredCount += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof error.statusCode === "number"
            ? error.statusCode
            : undefined;

        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscriptionByEndpoint(subscription.endpoint);
        }
      }
    }),
  );

  if (deliveredCount === 0) {
    return {
      channel: NotificationChannel.PUSH,
      delivered: false,
      skippedReason: "Push recipients were found, but delivery failed.",
    };
  }

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedId: input.relatedId,
      relatedType: input.relatedType,
      channel: NotificationChannel.PUSH,
      isRead: true,
      readAt: new Date(),
    },
  });

  return {
    channel: NotificationChannel.PUSH,
    delivered: true,
    notification,
  };
}
