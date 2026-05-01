import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { createWalletTopupCheckoutSession } from "@/lib/wallets/wallet-topup-payment-service";
import { walletSelfTopupSchema } from "@/lib/validations/wallet-topup";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (sessionUser.role !== "tradesman") {
    return NextResponse.json({ error: "전문가만 직접 충전할 수 있습니다." }, { status: 403 });
  }

  const rawBody = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = walletSelfTopupSchema.safeParse({
    amount: rawBody?.amount,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const topupPayment = await createWalletTopupCheckoutSession({
      userId: sessionUser.id,
      fullName: sessionUser.name,
      email: sessionUser.email,
      amount: parsed.data.amount,
    });

    return NextResponse.json({
      ok: true,
      topupPaymentId: topupPayment.id,
      amount: parsed.data.amount,
      checkoutUrl: topupPayment.checkoutUrl,
      status: topupPayment.status,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
}
