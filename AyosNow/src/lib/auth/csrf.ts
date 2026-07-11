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
  secFetchSite?: string | null;
  nodeEnv?: string;
}) {
  if (!isMutationMethod(params.method)) {
    return true;
  }

  const requestHost = normalizeHost(params.host);
  if (!requestHost) {
    return params.nodeEnv !== "production";
  }

  // 일부 모바일/브라우저 조합은 같은 사이트 POST에서도 Origin을 생략할 수 있다.
  // 이때 Sec-Fetch-Site가 same-origin/none이면 브라우저가 같은 사이트 요청이라고
  // 알려주는 것이므로 회원가입 같은 정상 요청은 허용하고, cross-site는 계속 막는다.
  if (!params.origin) {
    if (params.nodeEnv !== "production") {
      return true;
    }

    const secFetchSite = params.secFetchSite?.trim().toLowerCase();
    return secFetchSite === "same-origin" || secFetchSite === "none";
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
    secFetchSite: request.headers.get("sec-fetch-site"),
    nodeEnv: process.env.NODE_ENV,
  });
}
