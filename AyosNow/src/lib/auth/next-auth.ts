import type { Account, NextAuthOptions, Profile, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { AccountStatus, UserRole } from "@prisma/client";

import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import type { UserRole as AppUserRole } from "@/lib/types";

function isRealEnvValue(value: string | undefined) {
  return Boolean(value && !value.includes("replace-with"));
}

function toAppRole(role: UserRole): AppUserRole {
  if (role === UserRole.TRADESMAN) return "tradesman";
  if (role === UserRole.ADMIN) return "admin";
  return "customer";
}

function toDbRole(role: AppUserRole | undefined) {
  if (role === "tradesman") return UserRole.TRADESMAN;
  if (role === "admin") return UserRole.ADMIN;
  return UserRole.CUSTOMER;
}

async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

async function ensureOAuthUser(params: {
  user: NextAuthUser;
  account: Account | null;
  profile?: Profile;
}) {
  const email = params.user.email?.toLowerCase();
  if (!email) {
    return false;
  }

  const fullName =
    params.user.name ??
    params.profile?.name ??
    email.split("@")[0] ??
    "PuntaGo User";

  const avatarUrl = params.user.image ?? null;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (existingUser.status !== AccountStatus.ACTIVE) {
      // 정지/비활성 계정은 OAuth로 다시 로그인해도 자동 복구하지 않는다.
      // 계정 상태는 관리자나 별도 복구 절차에서만 바꿔야 안전하다.
      return false;
    }

    await prisma.user.update({
      where: { email },
      data: {
        fullName,
        avatarUrl,
      },
    });

    return true;
  }

  await prisma.user.create({
    data: {
      email,
      fullName,
      avatarUrl,
      status: AccountStatus.ACTIVE,
      // OAuth 사용자는 비밀번호 로그인을 쓰지 않는다.
      // passwordHash는 기존 스키마와 맞추기 위해 provider 표시만 저장한다.
      passwordHash: `oauth:${params.account?.provider ?? "unknown"}`,
      role: UserRole.CUSTOMER,
      // Google 신규 가입자는 먼저 고객/전문가 역할을 직접 선택해야 한다.
      // 선택 전에는 기본 고객처럼 저장하되, 화면에서는 역할 선택 페이지로 보낸다.
      roleSelectedAt: null,
    },
  });

  return true;
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      const password = credentials?.password;

      if (!email || !password) {
        return null;
      }

      const user = await findUserByEmail(email);
      if (!user || user.status !== AccountStatus.ACTIVE) {
        return null;
      }

      if (!verifyPassword(password, user.passwordHash)) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: toAppRole(user.role),
      };
    },
  }),
];

if (
  isRealEnvValue(process.env.GOOGLE_CLIENT_ID) &&
  isRealEnvValue(process.env.GOOGLE_CLIENT_SECRET)
) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // PuntaGo 로그아웃은 우리 앱 세션만 끊는다.
          // Chrome/Google 계정 세션은 남아 있을 수 있으므로, 다시 로그인할 때 계정 선택 화면을 강제로 보여준다.
          prompt: "select_account",
        },
      },
    }),
  );
}

export function getOAuthProviderStatus() {
  return {
    google:
      isRealEnvValue(process.env.GOOGLE_CLIENT_ID) &&
      isRealEnvValue(process.env.GOOGLE_CLIENT_SECRET),
  };
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        return ensureOAuthUser({ user, account, profile });
      }

      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;

      if (email) {
        const dbUser = await findUserByEmail(email);

        if (dbUser) {
          token.sub = dbUser.id;
          token.name = dbUser.fullName;
          token.email = dbUser.email;
          token.role = toAppRole(dbUser.role);
          token.needsRoleSelection = dbUser.roleSelectedAt === null;
        } else if (user && "role" in user) {
          token.role = user.role;
          token.needsRoleSelection = user.needsRoleSelection ?? false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as AppUserRole | undefined) ?? "customer";
        session.user.needsRoleSelection = token.needsRoleSelection ?? false;
      }

      return session;
    },
  },
};

export { toAppRole, toDbRole };
