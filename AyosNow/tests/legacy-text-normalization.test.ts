import test from "node:test";
import assert from "node:assert/strict";

import { NotificationRelatedType, NotificationType } from "@prisma/client";

import { normalizeLegacyNotificationText } from "../src/lib/notifications/legacy-text.ts";
import {
  normalizeTradesmanProfileBio,
  normalizeTradesmanProfileHeadline,
} from "../src/lib/tradesmen/profile-text.ts";

test("legacy Korean booking notifications are shown in English", () => {
  const normalized = normalizeLegacyNotificationText({
    title: "새로운 예약이 접수되었습니다.",
    message: "aircon 예약이 접수되었습니다.",
    relatedType: NotificationRelatedType.BOOKING,
    type: NotificationType.BOOKING_CREATED,
  });

  assert.equal(normalized.title, "New booking received");
  assert.equal(normalized.message, "A booking for aircon was received.");
});

test("legacy Korean quote request notifications are shown in English", () => {
  const normalized = normalizeLegacyNotificationText({
    title: "새 견적 요청이 도착했습니다",
    message: "새 견적 요청이 등록되었습니다.",
    relatedType: NotificationRelatedType.QUOTE_REQUEST,
    type: NotificationType.QUOTE_REQUEST,
  });

  assert.equal(normalized.title, "New quote request received");
  assert.equal(normalized.message, "A new quote request was posted.");
});

test("legacy Korean professional profile text is shown in English", () => {
  assert.equal(
    normalizeTradesmanProfileHeadline({
      headline: "andrea kim님의 전문 서비스",
      fullName: "andrea kim",
    }),
    "andrea kim's professional services",
  );

  assert.equal(
    normalizeTradesmanProfileBio(
      "전문 기술 카테고리 설정 후 포트폴리오와 소개를 더 채워 넣을 수 있습니다.",
    ),
    "You can add portfolio items and a stronger introduction after choosing specialty categories.",
  );
});
