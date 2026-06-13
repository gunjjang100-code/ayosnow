import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import {
  deleteAdminCategory,
  updateAdminCategory,
} from "@/lib/admin/admin-category-service";
import { AppError, toErrorResponseStatus } from "@/lib/errors/app-error";
import { adminCategoryUpdateSchema } from "@/lib/validations/admin-category";
import type { Locale } from "@/lib/types";

function readLocale(request: NextRequest): Locale {
  const locale = request.nextUrl.searchParams.get("locale");
  return locale === "fil" || locale === "en" ? locale : "ko";
}

async function requireAdmin(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return {
      error: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }),
    };
  }

  if (sessionUser.role !== "admin") {
    return {
      error: NextResponse.json({ error: "관리자만 카테고리를 수정할 수 있습니다." }, { status: 403 }),
    };
  }

  return { sessionUser };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const rawBody = await request.json().catch(() => null);
  const parsed = adminCategoryUpdateSchema.safeParse({
    ...(typeof rawBody === "object" && rawBody ? rawBody : {}),
    id,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await updateAdminCategory({
      input: parsed.data,
      adminUserId: auth.sessionUser.id,
      locale: readLocale(request),
    });

    return NextResponse.json({ ok: true, category });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AppError || error instanceof Error
            ? error.message
            : "카테고리를 수정하지 못했습니다.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;

  try {
    await deleteAdminCategory({ id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AppError || error instanceof Error
            ? error.message
            : "카테고리를 삭제하지 못했습니다.",
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}

