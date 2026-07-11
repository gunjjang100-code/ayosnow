import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { createAdminCategory } from "@/lib/admin/admin-category-service";
import { AppError, toErrorResponseStatus } from "@/lib/errors/app-error";
import { adminCategoryCreateSchema } from "@/lib/validations/admin-category";
import type { Locale } from "@/lib/types";

function readLocale(request: NextRequest): Locale {
  const locale = request.nextUrl.searchParams.get("locale");
  return locale === "fil" || locale === "en" ? locale : "en";
}

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Only admins can create categories." }, { status: 403 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = adminCategoryCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await createAdminCategory({
      input: parsed.data,
      adminUserId: sessionUser.id,
      locale: readLocale(request),
    });

    return NextResponse.json({ ok: true, category });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AppError || error instanceof Error
            ? error.message
            : "Could not create the category.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
