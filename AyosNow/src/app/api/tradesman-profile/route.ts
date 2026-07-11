import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import {
  addTradesmanCertification,
  addTradesmanPortfolioItem,
  updateTradesmanProfile,
} from "@/lib/tradesmen/manage-tradesman-profile-service";
import {
  addTradesmanCertificationSchema,
  addTradesmanPortfolioSchema,
  updateTradesmanProfileSchema,
} from "@/lib/validations/tradesman-profile";

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "tradesman") {
    return NextResponse.json(
      { error: "Only professional accounts can edit a professional profile." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = updateTradesmanProfileSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const profile = await updateTradesmanProfile({
      userId: sessionUser.id,
      input: parsed.data,
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not update the profile.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "tradesman") {
    return NextResponse.json(
      { error: "Only professional accounts can update professional profile content." },
      { status: 403 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  if (rawBody && typeof rawBody === "object" && "type" in rawBody) {
    const type = (rawBody as { type?: unknown }).type;

    if (type === "certification") {
      const parsed = addTradesmanCertificationSchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }

      try {
        const certification = await addTradesmanCertification({
          userId: sessionUser.id,
          input: parsed.data,
        });

        return NextResponse.json({ ok: true, certification });
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error ? error.message : "Could not add the certificate.",
          },
          { status: toErrorResponseStatus(error, 500) },
        );
      }
    }
  }

  const parsed = addTradesmanPortfolioSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const portfolioItem = await addTradesmanPortfolioItem({
      userId: sessionUser.id,
      input: parsed.data,
    });

    return NextResponse.json({ ok: true, portfolioItem });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not add the portfolio photo.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
