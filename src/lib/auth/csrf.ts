import type { NextRequest } from "next/server";

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeHost(value: string | null) {
  return value?.split(",")[0]?.trim().toLowerCase() ?? "";
}

function getRequestHost(request: NextRequest) {
  return (
    normalizeHost(request.headers.get("x-forwarded-host")) ||
    normalizeHost(request.headers.get("host"))
  );
}

export function isMutationMethod(method: string) {
  return mutationMethods.has(method.toUpperCase());
}

export function isAllowedMutationOrigin(params: {
  method: string;
  origin: string | null;
  host: string | null;
  nodeEnv?: string;
}) {
  if (!isMutationMethod(params.method)) {
    return true;
  }

  // 개발 중에는 curl이나 Node 테스트처럼 Origin 헤더가 없는 요청이 자주 있다.
  // 운영에서는 쿠키 기반 API를 보호해야 하므로 Origin이 없으면 막는다.
  if (!params.origin) {
    return params.nodeEnv !== "production";
  }

  const requestHost = normalizeHost(params.host);
  if (!requestHost) {
    return params.nodeEnv !== "production";
  }

  try {
    const originHost = new URL(params.origin).host.toLowerCase();
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export function isSameOriginMutationRequest(request: NextRequest) {
  return isAllowedMutationOrigin({
    method: request.method,
    origin: request.headers.get("origin"),
    host: getRequestHost(request),
    nodeEnv: process.env.NODE_ENV,
  });
}
