import "dotenv/config";

const requiredEnvNames = [
  "DATABASE_URL",
  "APP_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "PAYMONGO_SECRET_KEY",
  "PAYMONGO_PUBLIC_KEY",
  "PAYMONGO_WEBHOOK_SECRET",
  "NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY",
  "WEB_PUSH_PRIVATE_KEY",
  "WEB_PUSH_CONTACT_EMAIL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
];

const errors = [];

function getEnv(name) {
  return process.env[name]?.trim();
}

function isPlaceholder(value) {
  return !value || value.includes("replace-with") || value.includes("example");
}

for (const name of requiredEnvNames) {
  const value = getEnv(name);

  if (isPlaceholder(value)) {
    errors.push(`${name} 값이 비어 있거나 예시 값입니다.`);
  }
}

const appUrl = getEnv("APP_URL");
const nextAuthUrl = getEnv("NEXTAUTH_URL");
if (appUrl && /localhost|127\.0\.0\.1/.test(appUrl)) {
  errors.push("APP_URL이 localhost입니다. 운영에서는 실제 https 도메인을 써야 합니다.");
}

if (appUrl && !appUrl.startsWith("https://")) {
  errors.push("APP_URL은 운영에서 https:// 로 시작해야 합니다.");
}

if (nextAuthUrl && /localhost|127\.0\.0\.1/.test(nextAuthUrl)) {
  errors.push("NEXTAUTH_URL이 localhost입니다. 운영에서는 실제 https 도메인을 써야 합니다.");
}

if (nextAuthUrl && !nextAuthUrl.startsWith("https://")) {
  errors.push("NEXTAUTH_URL은 운영에서 https:// 로 시작해야 합니다.");
}

if (getEnv("ENABLE_DEMO_AUTH") === "true") {
  errors.push("ENABLE_DEMO_AUTH=true 입니다. 운영에서는 데모 로그인을 꺼야 합니다.");
}

if (getEnv("ENABLE_DEMO_DATA") === "true") {
  errors.push("ENABLE_DEMO_DATA=true 입니다. 운영에서는 데모 데이터 자동 생성을 꺼야 합니다.");
}

if (errors.length > 0) {
  console.error("Production readiness check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Production readiness check passed.");
