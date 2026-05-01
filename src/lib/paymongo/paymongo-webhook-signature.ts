import crypto from "node:crypto";

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyPaymongoWebhookSignatureWithSecret(params: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}) {
  if (!params.signatureHeader) {
    return false;
  }

  const headerParts = Object.fromEntries(
    params.signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim() ?? ""];
    }),
  );

  const timestamp = headerParts.t;
  const expectedSignature = headerParts.te || headerParts.li;

  if (!timestamp || !expectedSignature) {
    return false;
  }

  const signedPayload = `${timestamp}.${params.rawBody}`;
  const computed = crypto
    .createHmac("sha256", params.secret)
    .update(signedPayload)
    .digest("hex");

  return timingSafeEqual(computed, expectedSignature);
}
