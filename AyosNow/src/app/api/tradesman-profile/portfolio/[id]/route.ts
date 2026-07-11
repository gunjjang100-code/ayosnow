import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import {
  deleteTradesmanPortfolioItem,
  updateTradesmanPortfolioItem,
} from "@/lib/tradesmen/manage-tradesman-profile-service";
import { updateTradesmanPortfolioSchema } from "@/lib/validations/tradesman-profile";

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
      { error: "Only professional accounts can edit portfolio photos." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const rawBody = await request.json().catch(() => null);
  const parsed = updateTradesmanPortfolioSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const portfolioItem = await updateTradesmanPortfolioItem({
      userId: sessionUser.id,
      portfolioItemId: id,
      input: parsed.data,
    });

    return NextResponse.json({ ok: true, portfolioItem });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update the portfolio photo.",
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
      { error: "Only professional accounts can delete portfolio photos." },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    await deleteTradesmanPortfolioItem({
      userId: sessionUser.id,
      portfolioItemId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete the portfolio photo.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
