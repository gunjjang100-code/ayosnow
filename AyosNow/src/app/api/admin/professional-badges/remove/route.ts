import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { AppError, toErrorResponseStatus } from "@/lib/errors/app-error";
import { manuallyRemoveProfessionalBadge } from "@/lib/professional-badges/professional-badge-service";
import { professionalBadgeManualRemoveSchema } from "@/lib/validations/professional-badges";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can remove professional badges." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = professionalBadgeManualRemoveSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const badge = await manuallyRemoveProfessionalBadge({
      profileId: parsed.data.profileId,
      code: parsed.data.code,
      reason: parsed.data.reason,
      adminUserId: sessionUser.id,
    });

    return NextResponse.json({ ok: true, badge });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AppError || error instanceof Error
            ? error.message
            : "Could not remove this professional badge.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
