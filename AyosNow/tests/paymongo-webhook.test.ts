import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { verifyPaymongoWebhookSignatureWithSecret } from "../src/lib/paymongo/paymongo-webhook-signature.ts";

function makeSignature(secret: string, body: string, timestamp: string) {
  const signedPayload = `${timestamp}.${body}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},te=${signature}`;
}

test("PayMongo 웹훅 서명이 맞으면 true를 반환한다", () => {
  const body = JSON.stringify({ data: { id: "evt_123" } });
  const signatureHeader = makeSignature("test-webhook-secret", body, "1710000000");

  assert.equal(
    verifyPaymongoWebhookSignatureWithSecret({
      rawBody: body,
      signatureHeader,
      secret: "test-webhook-secret",
    }),
    true,
  );
});

test("PayMongo 웹훅 서명이 틀리면 false를 반환한다", () => {
  const body = JSON.stringify({ data: { id: "evt_123" } });

  assert.equal(
    verifyPaymongoWebhookSignatureWithSecret({
      rawBody: body,
      signatureHeader: "t=1710000000,te=wrong-signature",
      secret: "test-webhook-secret",
    }),
    false,
  );
});
