import {
  NotificationRelatedType,
  NotificationType,
} from "@prisma/client";

const hangulPattern = /[가-힣]/;

function fallbackNotificationText(params: {
  relatedType: NotificationRelatedType | null;
  type: NotificationType;
}) {
  if (params.relatedType === NotificationRelatedType.BOOKING) {
    return {
      title: "Booking update",
      message: "You have a booking update in PuntaGo.",
    };
  }

  if (params.relatedType === NotificationRelatedType.QUOTE_REQUEST) {
    return {
      title: "Quote request update",
      message: "You have a quote request update in PuntaGo.",
    };
  }

  if (params.type === NotificationType.BOOKING_CREATED) {
    return {
      title: "Booking update",
      message: "You have a booking update in PuntaGo.",
    };
  }

  return {
    title: "Notification",
    message: "You have a new PuntaGo notification.",
  };
}
export function normalizeLegacyNotificationText(notification: {
  title: string;
  message: string;
  relatedType: NotificationRelatedType | null;
  type: NotificationType;
}) {
  let title = notification.title;
  let message = notification.message;

  // Old internal test data may still live in D1.
  // New notifications are created in English, but old records are cleaned before display.
  if (title.includes("예약") && (title.includes("도착") || title.includes("접수"))) {
    title = "New booking received";
  } else if (title.includes("견적 요청") && (title.includes("도착") || title.includes("접수"))) {
    title = "New quote request received";
  } else if (title.includes("견적") && title.includes("도착")) {
    title = "New quote received";
  }

  const bookingMessageMatch = message.match(/^(.+?)\s*예약이\s*(접수|도착)되었습니다\.?$/);
  if (bookingMessageMatch) {
    message = `A booking for ${bookingMessageMatch[1]} was received.`;
  } else if (
    message.includes("견적 요청") &&
    (message.includes("등록") || message.includes("접수") || message.includes("도착"))
  ) {
    message = "A new quote request was posted.";
  } else if (message.includes("견적") && message.includes("도착")) {
    message = "A new quote was received.";
  }

  const fallback = fallbackNotificationText({
    relatedType: notification.relatedType,
    type: notification.type,
  });

  return {
    title: hangulPattern.test(title) ? fallback.title : title,
    message: hangulPattern.test(message) ? fallback.message : message,
  };
}
