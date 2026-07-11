import { AccountStatus, UserRole as DbUserRole } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/types";

function toAppRole(role: DbUserRole): UserRole {
  if (role === DbUserRole.TRADESMAN) return "tradesman";
  if (role === DbUserRole.ADMIN) return "admin";
  return "customer";
}

export async function getFreshRoleStateForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      roleSelectedAt: true,
      status: true,
    },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.status !== AccountStatus.ACTIVE) {
    throw new AppError("Account is not active.", 403);
  }

  return {
    role: toAppRole(user.role),
    needsRoleSelection: user.roleSelectedAt === null,
  };
}
