import { z } from "zod";

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().trim().url("A valid push endpoint is required."),
  keys: z.object({
    p256dh: z.string().trim().min(1, "p256dh key is required."),
    auth: z.string().trim().min(1, "auth key is required."),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
