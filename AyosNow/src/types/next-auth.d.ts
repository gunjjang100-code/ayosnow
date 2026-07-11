import type { UserRole } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      needsRoleSelection?: boolean;
    };
  }

  interface User {
    role?: UserRole;
    needsRoleSelection?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    needsRoleSelection?: boolean;
  }
}
