import "server-only";

import webpush from "web-push";

const fallbackPublicKey = "BE-ScJXcZDeLK713zEjj-Hfwg_tzbTRBRic33R0owXTZOtbmC8iAAhNPigr-hMB-IpwyDKbjEfWmQxVXVTUVBO0";
const fallbackPrivateKey = "Bhq7bUtPXyI644IW9X4p5m0mM94ppSal44HGsCuAL80";

function getWebPushContactEmail() {
  return process.env.WEB_PUSH_CONTACT_EMAIL ?? "mailto:ayosnow@example.com";
}

export function getWebPushPublicKey() {
  return process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? fallbackPublicKey;
}

function getWebPushPrivateKey() {
  return process.env.WEB_PUSH_PRIVATE_KEY ?? fallbackPrivateKey;
}

export function getConfiguredWebPush() {
  // 개발 단계에서는 바로 테스트할 수 있도록 기본 키를 같이 둔다.
  // 실제 운영 배포에서는 환경 변수로 교체하는 것이 안전하다.
  webpush.setVapidDetails(
    getWebPushContactEmail(),
    getWebPushPublicKey(),
    getWebPushPrivateKey(),
  );

  return webpush;
}
