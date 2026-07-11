import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import { reviewAccountDeletionRequest } from "@/lib/account/account-deletion-service";
import { adminAccountDeletionReviewSchema } from "@/lib/validations/account-deletion";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can review account deletion requests." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = adminAccountDeletionReviewSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await reviewAccountDeletionRequest({
      requestId: parsed.data.requestId,
      adminUserId: sessionUser.id,
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote,
    });

    return NextResponse.json({
      ok: true,
      request: {
        id: result.id,
        status: result.status,
        reviewedAt: result.reviewedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not review the account deletion request.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
