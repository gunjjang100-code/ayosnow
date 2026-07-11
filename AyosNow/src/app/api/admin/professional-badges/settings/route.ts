import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { AppError, toErrorResponseStatus } from "@/lib/errors/app-error";
import { updateProfessionalBadgeSettings } from "@/lib/professional-badges/professional-badge-service";
import { professionalBadgeSettingsSchema } from "@/lib/validations/professional-badges";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can update professional badge settings." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = professionalBadgeSettingsSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const settings = await updateProfessionalBadgeSettings({
      adminUserId: sessionUser.id,
      input: parsed.data,
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AppError || error instanceof Error
            ? error.message
            : "Could not update professional badge settings.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
