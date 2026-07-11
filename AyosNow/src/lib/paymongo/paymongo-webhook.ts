import { getPaymongoWebhookSecret } from "@/lib/paymongo/paymongo-client";
import { verifyPaymongoWebhookSignatureWithSecret } from "@/lib/paymongo/paymongo-webhook-signature";

export function verifyPaymongoWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
}) {
  // 중요한 부분:
  // 리다이렉트 성공 화면만 보고 충전하지 않고,
  // PayMongo가 보낸 "원본 바디 + 서명"을 서버에서 다시 계산해서 맞을 때만 통과시킨다.
  return verifyPaymongoWebhookSignatureWithSecret({
    ...params,
    secret: getPaymongoWebhookSecret(),
  });
}
