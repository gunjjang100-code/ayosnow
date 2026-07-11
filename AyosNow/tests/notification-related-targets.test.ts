import test from "node:test";
import assert from "node:assert/strict";

import { NotificationRelatedType } from "@prisma/client";

import { shouldShowNotificationForExistingTarget } from "../src/lib/notifications/related-targets.ts";

test("notifications without a related target stay visible", () => {
  assert.equal(
    shouldShowNotificationForExistingTarget(
      { relatedId: null, relatedType: null },
      { bookingIds: new Set(), quoteRequestIds: new Set() },
    ),
    true,
  );
});

test("quote request notifications are hidden when the quote request no longer exists", () => {
  assert.equal(
    shouldShowNotificationForExistingTarget(
      {
        relatedId: "missing-request",
        relatedType: NotificationRelatedType.QUOTE_REQUEST,
      },
      { bookingIds: new Set(), quoteRequestIds: new Set(["existing-request"]) },
    ),
    false,
  );
});

test("quote request notifications stay visible when the quote request exists", () => {
  assert.equal(
    shouldShowNotificationForExistingTarget(
      {
        relatedId: "existing-request",
        relatedType: NotificationRelatedType.QUOTE_REQUEST,
      },
      { bookingIds: new Set(), quoteRequestIds: new Set(["existing-request"]) },
    ),
    true,
  );
});

test("booking notifications are hidden when the booking no longer exists", () => {
  assert.equal(
    shouldShowNotificationForExistingTarget(
      {
        relatedId: "missing-booking",
        relatedType: NotificationRelatedType.BOOKING,
      },
      { bookingIds: new Set(["existing-booking"]), quoteRequestIds: new Set() },
    ),
    false,
  );
});

test("booking notifications stay visible when the booking exists", () => {
  assert.equal(
    shouldShowNotificationForExistingTarget(
      {
        relatedId: "existing-booking",
        relatedType: NotificationRelatedType.BOOKING,
      },
      { bookingIds: new Set(["existing-booking"]), quoteRequestIds: new Set() },
    ),
    true,
  );
});
