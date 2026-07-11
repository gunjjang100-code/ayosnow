import { NotificationChannel } from "@prisma/client";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

import type { NotificationDispatchInput, NotificationDispatchResult } from "./types";

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendEmailNotification(
  input: NotificationDispatchInput,
): Promise<NotificationDispatchResult> {
  const config = getEmailConfig();

  if (!config) {
    return {
      channel: NotificationChannel.EMAIL,
      delivered: false,
      skippedReason: "Resend email settings are missing.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      email: true,
      fullName: true,
    },
  });

  if (!user?.email) {
    return {
      channel: NotificationChannel.EMAIL,
      delivered: false,
      skippedReason: "The user does not have an email address for delivery.",
    };
  }

  const resend = new Resend(config.apiKey);
  const safeTitle = escapeHtml(input.title);
  const safeMessage = escapeHtml(input.message).replaceAll("\n", "<br />");

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to: [user.email],
      subject: input.title,
      text: input.message,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h1 style="font-size: 20px;">${safeTitle}</h1>
          <p>${safeMessage}</p>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
            PuntaGo notification for ${escapeHtml(user.fullName)}
          </p>
        </div>
      `,
    });

    if (error) {
      return {
        channel: NotificationChannel.EMAIL,
        delivered: false,
        skippedReason: error.message,
      };
    }
  } catch (error) {
    return {
      channel: NotificationChannel.EMAIL,
      delivered: false,
      skippedReason:
        error instanceof Error ? error.message : "Email delivery failed.",
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
