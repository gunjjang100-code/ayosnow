import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import {
  deleteTradesmanCertification,
  updateTradesmanCertification,
} from "@/lib/tradesmen/manage-tradesman-profile-service";
import { updateTradesmanCertificationSchema } from "@/lib/validations/tradesman-profile";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "tradesman") {
    return NextResponse.json(
      { error: "Only professional accounts can edit certificates." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const rawBody = await request.json().catch(() => null);
  const parsed = updateTradesmanCertificationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const certification = await updateTradesmanCertification({
      userId: sessionUser.id,
      certificationId: id,
      input: parsed.data,
    });

    return NextResponse.json({ ok: true, certification });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update the certificate.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "tradesman") {
    return NextResponse.json(
      { error: "Only professional accounts can delete certificates." },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    await deleteTradesmanCertification({
      userId: sessionUser.id,
      certificationId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete the certificate.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
