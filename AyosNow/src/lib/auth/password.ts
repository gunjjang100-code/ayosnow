import crypto from "node:crypto";

const algorithm = "scrypt";
const keyLength = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, keyLength).toString("hex");

  // 비밀번호 원문은 절대 저장하지 않고, 검증에 필요한 방식/소금/해시만 저장한다.
  return `${algorithm}:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [storedAlgorithm, salt, storedDerivedKey] = storedHash.split(":");

  if (storedAlgorithm !== algorithm || !salt || !storedDerivedKey) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, keyLength);
  const storedBuffer = Buffer.from(storedDerivedKey, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedKey);
}
