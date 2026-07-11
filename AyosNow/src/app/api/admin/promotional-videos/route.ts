import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { savePromotionalVideoSettings } from "@/lib/promotional-videos/promotional-video-service";
import { promotionalVideoSettingsUpdateSchema } from "@/lib/validations/promotional-videos";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can update promotional videos." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = promotionalVideoSettingsUpdateSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const settings = await savePromotionalVideoSettings({
      videoUrls: parsed.data.videoUrls,
      adminUserId: sessionUser.id,
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not update promotional videos.",
      },
      { status: 500 },
    );
  }
}
