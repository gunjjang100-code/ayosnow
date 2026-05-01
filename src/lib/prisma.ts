import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma__: PrismaClient | undefined;
}

let cachedPrisma: PrismaClient | undefined;

function createPrismaClient() {
  if (cachedPrisma) {
    return cachedPrisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 환경 변수가 비어 있습니다.");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  // 개발 중에는 파일이 자주 다시 불린다.
  // 그래서 실제로 DB를 쓸 때만 PrismaClient를 만들고,
  // 한 번 만든 뒤에는 전역 상자에 넣어서 다시 재사용한다.
  cachedPrisma =
    global.__prisma__ ??
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    global.__prisma__ = cachedPrisma;
  }

  return cachedPrisma;
}

// 여기서는 PrismaClient를 바로 만들지 않는다.
// 대신 실제로 `prisma.user.findMany()` 같은 속성을 처음 읽을 때만
// 내부에서 진짜 클라이언트를 생성한다.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = createPrismaClient();
    const value = Reflect.get(client, property, receiver);

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
}) as PrismaClient;
