import "dotenv/config";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient as NodePrismaClient } from "@prisma/client";
import { PrismaClient as EdgePrismaClient } from "@prisma/client/edge";

type PrismaClient = EdgePrismaClient;

const PrismaClientConstructor = (
  process.env.NODE_ENV === "development" ? NodePrismaClient : EdgePrismaClient
) as typeof EdgePrismaClient;

declare global {
  var __prisma__: PrismaClient | undefined;
}

let cachedPrisma: PrismaClient | undefined;

function createPrismaClient() {
  const d1Database = (() => {
    try {
      return getCloudflareContext().env.PUNTAGO_DB;
    } catch {
      return null;
    }
  })();

  const adapter = d1Database
    ? new PrismaD1(d1Database)
    : process.env.CLOUDFLARE_D1_TOKEN &&
        process.env.CLOUDFLARE_ACCOUNT_ID &&
        process.env.CLOUDFLARE_DATABASE_ID
      ? new PrismaD1({
          CLOUDFLARE_D1_TOKEN: process.env.CLOUDFLARE_D1_TOKEN,
          CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
          CLOUDFLARE_DATABASE_ID: process.env.CLOUDFLARE_DATABASE_ID,
        })
      : null;

  if (!adapter) {
    throw new Error(
      "Cloudflare D1 connection information is missing. In Cloudflare, set the PUNTAGO_DB binding. For local HTTP access, set CLOUDFLARE_D1_TOKEN, CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_DATABASE_ID.",
    );
  }

  if (d1Database) {
    // Cloudflare Worker의 D1 바인딩은 요청 실행 문맥과 강하게 연결된다.
    // 전역 PrismaClient를 재사용하면 여러 요청의 문맥이 섞여서
    // Wrangler/Workers에서 "different request context" 경고나 hung 응답이 날 수 있다.
    // 그래서 실제 Worker 바인딩을 쓸 때는 요청마다 새 클라이언트를 만든다.
    return new PrismaClientConstructor({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  if (cachedPrisma) {
    return cachedPrisma;
  }

  // 로컬 HTTP D1 연결은 Cloudflare 요청 문맥이 없으므로 개발 중 재사용해도 안전하다.
  cachedPrisma =
    global.__prisma__ ??
    new PrismaClientConstructor({
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
