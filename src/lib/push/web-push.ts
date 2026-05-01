import "server-only";

import webpush from "web-push";

function getWebPushContactEmail() {
  return process.env.WEB_PUSH_CONTACT_EMAIL ?? "mailto:ayosnow@example.com";
}

export function getWebPushPublicKey() {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
  if (!publicKey) {
    return null;
  }

  return publicKey;
}

function getWebPushPrivateKey() {
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("WEB_PUSH_PRIVATE_KEY 환경 변수가 필요합니다.");
  }

  return privateKey;
}

export function getConfiguredWebPush() {
  const publicKey = getWebPushPublicKey();
  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY 환경 변수가 필요합니다.");
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
