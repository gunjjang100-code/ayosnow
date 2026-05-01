import { z } from "zod";

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().trim().url("유효한 푸시 endpoint가 필요합니다."),
  keys: z.object({
    p256dh: z.string().trim().min(1, "p256dh 키가 필요합니다."),
    auth: z.string().trim().min(1, "auth 키가 필요합니다."),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
