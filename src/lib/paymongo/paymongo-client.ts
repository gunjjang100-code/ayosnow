const PAYMONGO_API_BASE_URL = "https://api.paymongo.com/v1";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }

  // 운영에서는 예시 문자열이 그대로 들어가면 실제 결제/웹훅이 실패한다.
  // 그래서 "replace-with..." 같은 placeholder는 서버 시작 단계에서 바로 막는다.
  if (isProduction() && value.includes("replace-with")) {
    throw new Error(`${name} 운영 환경 값이 아직 placeholder입니다.`);
  }

  return value;
}

function getSecretKey() {
  return getRequiredEnv("PAYMONGO_SECRET_KEY");
}

export function getAppUrl() {
  const appUrl = (process.env.APP_URL ?? process.env.NEXTAUTH_URL)?.replace(/\/$/, "");

  if (!appUrl) {
    if (isProduction()) {
      throw new Error("운영 환경에서는 APP_URL 환경 변수가 필요합니다.");
    }

    return "http://localhost:3000";
  }

  if (isProduction() && /localhost|127\.0\.0\.1/.test(appUrl)) {
    throw new Error("운영 환경 APP_URL은 localhost를 사용할 수 없습니다.");
  }

  return appUrl;
}

export function getPaymongoWebhookSecret() {
  return getRequiredEnv("PAYMONGO_WEBHOOK_SECRET");
}

function getBasicAuthorizationHeader() {
  const encoded = Buffer.from(`${getSecretKey()}:`).toString("base64");
  return `Basic ${encoded}`;
}

export async function paymongoRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${PAYMONGO_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: getBasicAuthorizationHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const message =
      (data as { errors?: Array<{ detail?: string }> } | null)?.errors?.[0]
        ?.detail ?? "PayMongo 요청에 실패했습니다.";
    throw new Error(message);
  }

  if (!data) {
    throw new Error("PayMongo 응답을 읽지 못했습니다.");
  }

  return data;
}
