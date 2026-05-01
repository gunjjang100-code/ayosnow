import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { listAdminWallets } from "@/lib/admin/wallet-admin-service";
import { AppError, toErrorResponseStatus } from "@/lib/errors/app-error";
import { adminWalletActionSchema } from "@/lib/validations/admin-wallet";
import {
  createManualAdminTopup,
} from "@/lib/wallets/wallet-topup-payment-service";
import { deductWalletCreditsByAdmin } from "@/lib/wallets/wallet-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "관리자만 지갑을 수정할 수 있습니다." }, { status: 403 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = adminWalletActionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { userId } = await params;

    if (parsed.data.action === "add-credit") {
      await createManualAdminTopup({
        userId,
        amount: parsed.data.amount,
      });
    } else {
      await deductWalletCreditsByAdmin({
        userId,
        amount: parsed.data.amount,
      });
    }

    const wallets = await listAdminWallets();
    const wallet = wallets.find((item) => item.id === userId);

    return NextResponse.json({
      ok: true,
      wallet,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AppError || error instanceof Error
            ? error.message
            : "지갑을 수정하지 못했습니다.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
