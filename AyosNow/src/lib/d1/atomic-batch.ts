import { getCloudflareContext } from "@opennextjs/cloudflare";

export type D1AtomicValue = string | number | null;

export interface D1AtomicStatement {
  name: string;
  sql: string;
  params?: D1AtomicValue[];
}

interface D1HttpResponse {
  success: boolean;
  errors?: Array<{ message?: string }>;
  result?: Array<{ success?: boolean; error?: string }>;
}

function getD1Binding() {
  try {
    return getCloudflareContext().env.PUNTAGO_DB ?? null;
  } catch {
    return null;
  }
}

function getD1HttpConfiguration() {
  const token = process.env.CLOUDFLARE_D1_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;

  if (!token || !accountId || !databaseId) {
    return null;
  }

  return { token, accountId, databaseId };
}

/**
 * 여러 D1 문장을 하나의 트랜잭션으로 실행한다.
 *
 * Cloudflare Worker에서는 D1 `batch()`를 사용한다. 로컬 Next.js 개발에서는
 * 같은 D1 REST API의 batch 요청을 사용하므로 운영과 동일한 원자성을 유지한다.
 * 문장 하나라도 실패하면 D1이 전체 묶음을 되돌린다.
 */
export async function executeAtomicD1Batch(
  statements: D1AtomicStatement[],
  databaseOverride?: D1Database,
) {
  if (statements.length === 0) {
    return [];
  }

  const database = databaseOverride ?? getD1Binding();

  if (database) {
    const prepared = statements.map((statement) =>
      database
        .prepare(statement.sql)
        .bind(...(statement.params ?? [])),
    );
    const results = await database.batch(prepared);

    const failedIndex = results.findIndex((result) => !result.success);
    if (failedIndex >= 0) {
      throw new Error(
        `D1 atomic batch failed at ${statements[failedIndex]?.name ?? `statement ${failedIndex + 1}`}.`,
      );
    }

    return results;
  }

  const configuration = getD1HttpConfiguration();
  if (!configuration) {
    throw new Error(
      "Cloudflare D1 connection information is missing. Use the PUNTAGO_DB binding, or set CLOUDFLARE_D1_TOKEN, CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_DATABASE_ID for local development.",
    );
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${configuration.accountId}/d1/database/${configuration.databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${configuration.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        batch: statements.map((statement) => ({
          sql: statement.sql,
          params: statement.params ?? [],
        })),
      }),
    },
  );
  const payload = (await response.json()) as D1HttpResponse;

  if (!response.ok || !payload.success) {
    const details = payload.errors
      ?.map((error) => error.message)
      .filter(Boolean)
      .join("; ");
    throw new Error(`D1 atomic batch failed${details ? `: ${details}` : "."}`);
  }

  const failedIndex = payload.result?.findIndex((result) => result.success === false) ?? -1;
  if (failedIndex >= 0) {
    const failedResult = payload.result?.[failedIndex];
    throw new Error(
      `D1 atomic batch failed at ${statements[failedIndex]?.name ?? `statement ${failedIndex + 1}`}${failedResult?.error ? `: ${failedResult.error}` : "."}`,
    );
  }

  return payload.result ?? [];
}
