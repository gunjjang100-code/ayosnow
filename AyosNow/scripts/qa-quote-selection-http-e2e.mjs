const BASE_URL = process.env.QA_BASE_URL ?? "https://puntago.net";
const PASSWORD = process.env.QA_PASSWORD ?? "QaPass123!";
const RUN_ID = process.env.QA_RUN_ID ?? "qa_atomic_e2e_20260709_001";

class CookieJar {
  #cookies = new Map();

  setFromResponse(response) {
    const setCookie = response.headers.getSetCookie?.() ?? [];
    for (const cookie of setCookie) {
      const [pair] = cookie.split(";");
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex > 0) {
        this.#cookies.set(pair.slice(0, separatorIndex), pair.slice(separatorIndex + 1));
      }
    }
  }

  header() {
    return [...this.#cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
  }
}

async function request(path, options = {}, jar) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Origin", BASE_URL);
  if (jar?.header()) {
    headers.set("Cookie", jar.header());
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });

  jar?.setFromResponse(response);
  return response;
}

async function login(email) {
  const jar = new CookieJar();
  const csrfResponse = await request("/api/auth/csrf", {}, jar);
  const csrf = await csrfResponse.json();

  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    password: PASSWORD,
    callbackUrl: `${BASE_URL}/dashboard`,
    json: "true",
  });

  const loginResponse = await request(
    "/api/auth/callback/credentials?json=true",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
    jar,
  );

  if (!loginResponse.ok) {
    const text = await loginResponse.text();
    throw new Error(`Login failed for ${email}: ${loginResponse.status} ${text}`);
  }

  return jar;
}

async function selectQuote(jar, quoteId) {
  const response = await request(
    "/api/quotes/select",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quoteId }),
    },
    jar,
  );
  const body = await response.json().catch(() => null);
  return {
    status: response.status,
    ok: response.ok,
    body,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const customerJar = await login(`${RUN_ID}_customer@puntago.test`);
const otherCustomerJar = await login(`${RUN_ID}_other@puntago.test`);

const first = await selectQuote(customerJar, `${RUN_ID}_quote`);
assert(
  first.ok && first.body?.bookingId && first.body?.conversationId,
  `First quote selection failed: ${JSON.stringify(first)}`,
);

const retry = await selectQuote(customerJar, `${RUN_ID}_quote`);
assert(retry.ok, "Retry quote selection failed.");
assert(retry.body?.bookingId === first.body.bookingId, "Retry created a different booking.");
assert(
  retry.body?.conversationId === first.body.conversationId,
  "Retry created a different chat room.",
);

const wrongCustomer = await selectQuote(otherCustomerJar, `${RUN_ID}_wrong_quote`);
assert(!wrongCustomer.ok && wrongCustomer.status === 403, "Wrong customer was able to select a quote.");

const unverified = await selectQuote(customerJar, `${RUN_ID}_unverified_quote`);
assert(!unverified.ok && unverified.status === 403, "Unverified professional quote was accepted.");

const preChat = await selectQuote(customerJar, `${RUN_ID}_prechat_quote`);
assert(preChat.ok, "Pre-chat quote selection failed.");
assert(
  preChat.body?.conversationId === `${RUN_ID}_prechat_conv`,
  "Existing quote conversation was not reused.",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      first,
      retry,
      wrongCustomer,
      unverified,
      preChat,
    },
    null,
    2,
  ),
);
