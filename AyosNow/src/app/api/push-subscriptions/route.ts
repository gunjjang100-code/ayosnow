import { NextRequest, NextResponse } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import {
  listPushSubscriptionsForUser,
  removePushSubscriptionForUser,
  savePushSubscriptionForUser,
} from "@/lib/notifications/push-subscription-service";
import { pushSubscriptionSchema } from "@/lib/validations/push-subscription";

export async function GET(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const subscriptions = await listPushSubscriptionsForUser(sessionUser.id);

  return NextResponse.json({
    subscribed: subscriptions.length > 0,
    count: subscriptions.length,
  });
}

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const rawBody = (await request.json().catch(() => null)) as unknown;
  const parsed = pushSubscriptionSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Push subscription information is invalid.",
      },
      { status: 400 },
    );
  }

  await savePushSubscriptionForUser({
    userId: sessionUser.id,
    subscription: parsed.data,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const rawBody = (await request.json().catch(() => null)) as { endpoint?: string } | null;

  if (!rawBody?.endpoint) {
    return NextResponse.json(
      { error: "A push endpoint is required to unsubscribe." },
      { status: 400 },
    );
  }

  await removePushSubscriptionForUser({
    userId: sessionUser.id,
    endpoint: rawBody.endpoint,
  });

  return NextResponse.json({ ok: true });
}
