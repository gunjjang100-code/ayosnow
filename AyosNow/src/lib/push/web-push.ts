import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import webpush from "web-push";

function readRuntimeSecret(name: string) {
  try {
    const env = getCloudflareContext().env as Record<string, string | undefined>;
    const value = env[name]?.trim();

    if (value) {
      return value;
    }
  } catch {
    // 로컬 테스트처럼 Cloudflare 런타임이 아닐 때는 process.env를 사용한다.
  }

  return process.env[name]?.trim();
}

function isRealPushKey(value: string | undefined): value is string {
  return Boolean(value && !value.startsWith("replace-with-"));
}

function getWebPushContactEmail() {
  return readRuntimeSecret("WEB_PUSH_CONTACT_EMAIL") ?? "mailto:puntago@example.com";
}

export function getWebPushPublicKey(): string | null {
  const publicKey = readRuntimeSecret("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY");
  if (!isRealPushKey(publicKey)) {
    return null;
  }

  return publicKey;
}

function getWebPushPrivateKey() {
  const privateKey = readRuntimeSecret("WEB_PUSH_PRIVATE_KEY");
  if (!isRealPushKey(privateKey)) {
    throw new Error("WEB_PUSH_PRIVATE_KEY environment variable is required.");
  }

  return privateKey;
}

export function getConfiguredWebPush() {
  const publicKey = getWebPushPublicKey();
  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY environment variable is required.");
  }

  // 보안상 VAPID private key는 코드에 두지 않고 환경 변수에서만 읽는다.
  // 키가 없으면 조용히 임시 키를 쓰지 않고, 바로 오류를 내서 배포 전에 알 수 있게 한다.
  webpush.setVapidDetails(
    getWebPushContactEmail(),
    publicKey,
    getWebPushPrivateKey(),
  );

  return webpush;
}
