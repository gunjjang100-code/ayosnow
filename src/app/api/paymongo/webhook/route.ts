import { NextResponse, type NextRequest } from "next/server";

import { AppError } from "@/lib/errors/app-error";
import { verifyPaymongoWebhookSignature } from "@/lib/paymongo/paymongo-webhook";
import { finalizeWalletTopupFromWebhook } from "@/lib/wallets/wallet-topup-payment-service";

type PaymongoWebhookPayload = {
  data?: {
    id?: string;
    attributes?: {
      type?: string;
      data?: {
        id?: string;
        attributes?: {
          payment_intent_id?: string;
        };
      };
    };
  };
};

function getCheckoutSessionId(payload: PaymongoWebhookPayload) {
  return payload.data?.attributes?.data?.id ?? null;
}

function getPaymentIntentId(payload: PaymongoWebhookPayload) {
  return payload.data?.attributes?.data?.attributes?.payment_intent_id ?? null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("Paymongo-Signature");

  if (!verifyPaymongoWebhookSignature({ rawBody, signatureHeader })) {
    return NextResponse.json({ error: "웹훅 서명이 올바르지 않습니다." }, { status: 401 });
  }

  const payload = (() => {
    try {
      return JSON.parse(rawBody) as PaymongoWebhookPayload;
    } catch {
      return null;
    }
  })();

  if (!payload) {
    return NextResponse.json({ error: "웹훅 본문이 JSON 형식이 아닙니다." }, { status: 400 });
  }
  const eventId = payload.data?.id;
  const eventType = payload.data?.attributes?.type;

  if (!eventId || !eventType) {
    return NextResponse.json({ error: "웹훅 데이터 형식이 올바르지 않습니다." }, { status: 400 });
  }

  // 중요한 부분:
  // 성공 redirect 화면만 보고 충전하지 않고,
  // PayMongo 웹훅이 "결제 완료"라고 알려준 이벤트만 여기서 처리합니다.
  if (eventType !== "checkout_session.payment.paid") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const checkoutSessionId = getCheckoutSessionId(payload);

  if (!checkoutSessionId) {
    return NextResponse.json(
      { error: "체크아웃 세션 ID가 없는 웹훅입니다." },
      { status: 400 },
    );
  }

  try {
    const payment = await finalizeWalletTopupFromWebhook({
      checkoutSessionId,
      eventId,
      providerPaymentId: getPaymentIntentId(payload),
    });

    return NextResponse.json({
      ok: true,
      walletTopupPaymentId: payment.id,
      status: payment.status,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
}
