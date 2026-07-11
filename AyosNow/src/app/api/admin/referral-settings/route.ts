import { NextResponse, type NextRequest } from "next/server";

import { updateReferralSetting } from "@/lib/admin/admin-operating-settings-service";
import { getRequestSessionUser } from "@/lib/auth/session";
import { referralSettingUpdateSchema } from "@/lib/validations/admin-settings";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Only admins can update referral rewards." }, { status: 403 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = referralSettingUpdateSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const setting = await updateReferralSetting({
    input: parsed.data,
    adminUserId: sessionUser.id,
  });

  return NextResponse.json({
    ok: true,
    setting: {
      rewardCredits: setting.rewardCredits,
      isActive: setting.isActive,
    },
  });
}
