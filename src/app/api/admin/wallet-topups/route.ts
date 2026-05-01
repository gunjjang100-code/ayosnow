import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import {
  createManualAdminTopup,
  refundWalletTopupByAdmin,
} from "@/lib/wallets/wallet-topup-payment-service";
import { walletRefundSchema, walletTopupSchema } from "@/lib/validations/wallet-topup";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "관리자만 충전할 수 있습니다." }, { status: 403 });
  }

  const rawBody = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = walletTopupSchema.safeParse({
    userId: rawBody?.userId,
    amount: rawBody?.amount,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createManualAdminTopup(parsed.data);

    return NextResponse.json({
      ok: true,
      topupPaymentId: result.id,
      userId: result.userId,
      amount: result.amount,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "관리자만 환불할 수 있습니다." }, { status: 403 });
  }

  const rawBody = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = walletRefundSchema.safeParse({
    walletTopupPaymentId: rawBody?.walletTopupPaymentId,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const refunded = await refundWalletTopupByAdmin(parsed.data);

    return NextResponse.json({
      ok: true,
      walletTopupPaymentId: refunded.id,
      status: refunded.status,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
}
