import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function minutesFromTime(value: string) {
  if (!timePattern.test(value)) {
    return Number.NaN;
  }

  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

export const tradesmanAvailabilityItemSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isAvailable: z.boolean(),
    startTime: z.string().regex(timePattern, "Use HH:MM time."),
    endTime: z.string().regex(timePattern, "Use HH:MM time."),
  })
  .refine(
    (value) =>
      !value.isAvailable ||
      minutesFromTime(value.startTime) < minutesFromTime(value.endTime),
    {
      message: "End time must be later than start time.",
      path: ["endTime"],
    },
  );

export const tradesmanAvailabilityUpdateSchema = z.object({
  availability: z
    .array(tradesmanAvailabilityItemSchema)
    .min(1)
    .max(7)
    .refine(
      (items) => new Set(items.map((item) => item.dayOfWeek)).size === items.length,
      "Each day can only appear once.",
    ),
});
