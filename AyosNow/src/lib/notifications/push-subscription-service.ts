import { prisma } from "@/lib/prisma";
import type { PushSubscriptionInput } from "@/lib/validations/push-subscription";

export async function savePushSubscriptionForUser(params: {
  userId: string;
  subscription: PushSubscriptionInput;
  userAgent?: string | null;
}) {
  return prisma.pushSubscription.upsert({
    where: {
      endpoint: params.subscription.endpoint,
    },
    update: {
      userId: params.userId,
      p256dh: params.subscription.keys.p256dh,
      auth: params.subscription.keys.auth,
      userAgent: params.userAgent ?? null,
    },
    create: {
      userId: params.userId,
      endpoint: params.subscription.endpoint,
      p256dh: params.subscription.keys.p256dh,
      auth: params.subscription.keys.auth,
      userAgent: params.userAgent ?? null,
    },
  });
}

export async function removePushSubscriptionForUser(params: {
  userId: string;
  endpoint: string;
}) {
  const existing = await prisma.pushSubscription.findFirst({
    where: {
      userId: params.userId,
      endpoint: params.endpoint,
    },
  });

  if (!existing) {
    return false;
  }

  await prisma.pushSubscription.delete({
    where: {
      id: existing.id,
    },
  });

  return true;
}

export async function listPushSubscriptionsForUser(userId: string) {
  return prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function removePushSubscriptionByEndpoint(endpoint: string) {
  await prisma.pushSubscription.deleteMany({
    where: { endpoint },
  });
}
