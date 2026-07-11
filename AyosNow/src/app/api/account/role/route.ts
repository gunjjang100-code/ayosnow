import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toDbRole } from "@/lib/auth/next-auth";
import { getRequestIpAddress, getRequestUserAgent, recordUserConsent } from "@/lib/legal-consent";
import { prisma } from "@/lib/prisma";
import { roleSelectionSchema } from "@/lib/validations/auth";
import { ensureWalletForUser } from "@/lib/wallets/wallet-service";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = roleSelectionSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        roleSelectedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User was not found." }, { status: 404 });
    }

    if (user.roleSelectedAt) {
      return NextResponse.json({ error: "Account role has already been selected." }, { status: 409 });
    }

    const selectedRole = parsed.data.role;

    if (selectedRole === "tradesman") {
      // Cloudflare D1은 interactive transaction을 지원하지 않는다.
      // 그래서 지갑 생성은 upsert로 먼저 안전하게 준비하고, 역할 저장은 아래 updateMany에서
      // roleSelectedAt이 아직 비어 있을 때만 처리한다. 두 번 눌러도 한 번만 저장된다.
      await ensureWalletForUser({
        userId: sessionUser.id,
      });
    }

    await recordUserConsent({
      userId: sessionUser.id,
      consent: parsed.data.consent,
      ipAddress: getRequestIpAddress(request),
      userAgent: getRequestUserAgent(request),
    });

    const updateResult = await prisma.user.updateMany({
      where: {
        id: sessionUser.id,
        roleSelectedAt: null,
      },
      data: {
        role: toDbRole(selectedRole),
        roleSelectedAt: new Date(),
      },
    });

    if (updateResult.count !== 1) {
      return NextResponse.json({ error: "Account role has already been selected." }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      role: selectedRole,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the account role.";
    const status = message.includes("already") ? 409 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
