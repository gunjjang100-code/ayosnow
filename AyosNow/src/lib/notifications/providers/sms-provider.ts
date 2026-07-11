import { NotificationChannel } from "@prisma/client";
import twilio from "twilio";

import { prisma } from "@/lib/prisma";

import type { NotificationDispatchInput, NotificationDispatchResult } from "./types";

function getSmsConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  return {
    accountSid,
    authToken,
    fromNumber,
  };
}

export async function sendSmsNotification(
  input: NotificationDispatchInput,
): Promise<NotificationDispatchResult> {
  const config = getSmsConfig();

  if (!config) {
    return {
      channel: NotificationChannel.SMS,
      delivered: false,
      skippedReason: "Twilio SMS settings are missing.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      phoneNumber: true,
    },
  });

  if (!user?.phoneNumber) {
    return {
      channel: NotificationChannel.SMS,
      delivered: false,
      skippedReason: "The user does not have a phone number for SMS delivery.",
    };
  }

  const client = twilio(config.accountSid, config.authToken);

  try {
    await client.messages.create({
      body: `${input.title}\n${input.message}`.slice(0, 1500),
      from: config.fromNumber,
      to: user.phoneNumber,
    });
  } catch (error) {
    return {
      channel: NotificationChannel.SMS,
      delivered: false,
      skippedReason:
        error instanceof Error ? error.message : "SMS delivery failed.",
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
