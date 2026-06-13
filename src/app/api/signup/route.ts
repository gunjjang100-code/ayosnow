import { AccountStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { toDbRole } from "@/lib/auth/next-auth";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations/auth";
import { ensureWalletForUser } from "@/lib/wallets/wallet-service";

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "이미 가입된 이메일입니다. 로그인해 주세요." },
      { status: 409 },
    );
  }

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: parsed.data.email,
        phoneNumber: parsed.data.phoneNumber,
        fullName: parsed.data.fullName,
        passwordHash: hashPassword(parsed.data.password),
        role: toDbRole(parsed.data.role),
        roleSelectedAt: new Date(),
        status: AccountStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    if (parsed.data.role === "tradesman") {
      await ensureWalletForUser({
        userId: createdUser.id,
        tx,
      });
    }

    return createdUser;
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: parsed.data.role,
    },
  });
}
