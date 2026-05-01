import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import { updateTradesmanSkillSettings } from "@/lib/tradesmen/tradesman-skill-settings-service";
import { tradesmanSkillCategorySchema } from "@/lib/validations/tradesman-skills";

export async function PUT(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (sessionUser.role !== "tradesman") {
    return NextResponse.json(
      { error: "전문가 계정에서만 전문 기술 카테고리를 수정할 수 있습니다." },
      { status: 403 },
    );
  }

  const rawBody = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  const parsed = tradesmanSkillCategorySchema.safeParse({
    categorySlugs: rawBody?.categorySlugs,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await updateTradesmanSkillSettings({
      userId: sessionUser.id,
      categorySlugs: parsed.data.categorySlugs,
    });

    return NextResponse.json({
      ok: true,
      savedCategories: result.savedCategories,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "전문 기술 카테고리를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";

    return NextResponse.json(
      {
        error: {
          formErrors: [message],
          fieldErrors: {},
        },
      },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}
