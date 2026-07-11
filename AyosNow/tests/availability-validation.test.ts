import assert from "node:assert/strict";
import test from "node:test";

import {
  minutesFromTime,
  tradesmanAvailabilityUpdateSchema,
} from "../src/lib/validations/availability.ts";

test("accepts a valid professional availability schedule", () => {
  const result = tradesmanAvailabilityUpdateSchema.safeParse({
    availability: [
      {
        dayOfWeek: 1,
        isAvailable: true,
        startTime: "09:00",
        endTime: "18:00",
      },
    ],
  });

  assert.equal(result.success, true);
});

test("rejects availability where end time is not later than start time", () => {
  const result = tradesmanAvailabilityUpdateSchema.safeParse({
    availability: [
      {
        dayOfWeek: 1,
        isAvailable: true,
        startTime: "18:00",
        endTime: "09:00",
      },
    ],
  });

  assert.equal(result.success, false);
});

test("rejects duplicate days in one save request", () => {
  const result = tradesmanAvailabilityUpdateSchema.safeParse({
    availability: [
      {
        dayOfWeek: 1,
        isAvailable: true,
        startTime: "09:00",
        endTime: "12:00",
      },
      {
        dayOfWeek: 1,
        isAvailable: true,
        startTime: "13:00",
        endTime: "18:00",
      },
    ],
  });

  assert.equal(result.success, false);
});

test("converts HH:MM time into minutes for simple comparisons", () => {
  assert.equal(minutesFromTime("09:30"), 570);
});
