import { NotificationChannel } from "@prisma/client";

import { sendEmailNotification } from "./email-provider";
import { sendInAppNotification } from "./in-app-provider";
import { sendPushNotification } from "./push-provider";
import { sendSmsNotification } from "./sms-provider";
import type { NotificationDispatchInput, NotificationDispatchResult } from "./types";

export async function dispatchNotification(
  input: NotificationDispatchInput,
): Promise<NotificationDispatchResult> {
  if (input.channel === NotificationChannel.EMAIL) {
    return sendEmailNotification(input);
  }

  if (input.channel === NotificationChannel.PUSH) {
    return sendPushNotification(input);
  }

  if (input.channel === NotificationChannel.SMS) {
    return sendSmsNotification(input);
  }

  return sendInAppNotification(input);
}
