import { NextResponse, type NextRequest } from "next/server";

import { requestAccountDeletion } from "@/lib/account/account-deletion-service";
import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import { accountDeletionRequestSchema } from "@/lib/validations/account-deletion";

function readClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = accountDeletionRequestSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const deletionRequest = await requestAccountDeletion({
      userId: sessionUser.id,
      reason: parsed.data.reason,
      ipAddress: readClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      request: {
        id: deletionRequest.id,
        requestedAt: deletionRequest.requestedAt.toISOString(),
        reason: deletionRequest.reason,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create the account deletion request.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
