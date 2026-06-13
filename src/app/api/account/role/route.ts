import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toDbRole } from "@/lib/auth/next-auth";
import { prisma } from "@/lib/prisma";
import { roleSelectionSchema } from "@/lib/validations/auth";
import { ensureWalletForUser } from "@/lib/wallets/wallet-service";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = roleSelectionSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          roleSelectedAt: true,
        },
      });

      if (!user) {
        return null;
      }

      if (user.roleSelectedAt) {
        throw new Error("이미 가입 역할을 선택했습니다.");
      }

      const selectedRole = parsed.data.role;
      const savedUser = await tx.user.update({
        where: { id: sessionUser.id },
        data: {
          role: toDbRole(selectedRole),
          roleSelectedAt: new Date(),
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (selectedRole === "tradesman") {
        // 전문가로 활동하려면 견적 제출 수수료를 관리할 지갑이 필요하다.
        // 역할 선택과 지갑 생성을 같은 transaction 안에서 처리해 중간 실패를 막는다.
        await ensureWalletForUser({
          userId: sessionUser.id,
          tx,
        });
      }

      return savedUser;
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "사용자를 찾지 못했습니다." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      role: parsed.data.role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "가입 역할 저장에 실패했습니다.";
    const status = message.includes("이미") ? 409 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
