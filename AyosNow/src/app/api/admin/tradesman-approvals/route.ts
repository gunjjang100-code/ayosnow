import { TradesmanApprovalStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { reviewTradesmanApproval } from "@/lib/admin/tradesman-approval-service";
import { getRequestSessionUser } from "@/lib/auth/session";
import { AppError, toErrorResponseStatus } from "@/lib/errors/app-error";
import { adminExpertApprovalCreateSchema } from "@/lib/validations/admin-expert-approval";

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can review professional approvals." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = adminExpertApprovalCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.status === TradesmanApprovalStatus.PENDING) {
    return NextResponse.json(
      { error: "Admin review must approve, reject, or request changes." },
      { status: 400 },
    );
  }

  try {
    const approval = await reviewTradesmanApproval({
      profileId: parsed.data.profileId,
      adminUserId: sessionUser.id,
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote,
    });

    return NextResponse.json({ ok: true, approval });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AppError || error instanceof Error
            ? error.message
            : "Could not review this professional profile.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
