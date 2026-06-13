import { Prisma } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";
import type { AdminCategoryItem, Locale } from "@/lib/types";
import type {
  AdminCategoryCreateInput,
  AdminCategoryUpdateInput,
} from "@/lib/validations/admin-category";

type CategoryWithCount = Prisma.ServiceCategoryGetPayload<{
  include: {
    _count: {
      select: {
        services: true;
      };
    };
  };
}>;

function statusLabelFor(locale: Locale, isActive: boolean) {
  if (locale === "fil") {
    return isActive ? "Live" : "Nakatago";
  }

  if (locale === "en") {
    return isActive ? "Live" : "Hidden";
  }

  return isActive ? "활성" : "비활성";
}

function toAdminCategoryItem(
  category: CategoryWithCount,
  locale: Locale,
): AdminCategoryItem {
  return {
    id: category.id,
    slug: category.slug,
    nameKo: category.nameKo ?? category.name,
    nameFil: category.nameFil ?? category.nameEn ?? category.name,
    nameEn: category.nameEn ?? category.name,
    descriptionKo: category.descriptionKo ?? category.description,
    descriptionFil:
      category.descriptionFil ?? category.descriptionEn ?? category.description,
    descriptionEn: category.descriptionEn ?? category.description,
    name: category.name,
    description: category.description,
    serviceCount: category._count.services,
    statusLabel: statusLabelFor(locale, category.isActive),
    sortOrder: category.displayOrder,
    featured: category.featured,
    isActive: category.isActive,
  };
}

function buildCategoryData(input: AdminCategoryCreateInput) {
  return {
    slug: input.slug,
    // 기존 서비스 목록과 검색에서는 name/description을 계속 사용한다.
    // 그래서 한국어 값을 대표값으로 저장하고, 다국어 값은 별도 컬럼에 보관한다.
    name: input.nameKo,
    description: input.descriptionKo,
    nameKo: input.nameKo,
    nameFil: input.nameFil,
    nameEn: input.nameEn,
    descriptionKo: input.descriptionKo,
    descriptionFil: input.descriptionFil,
    descriptionEn: input.descriptionEn,
    iconName: input.iconName,
    isActive: input.isActive,
    featured: input.featured,
    displayOrder: input.displayOrder,
  };
}

export async function listAdminCategoryItems(locale: Locale) {
  const categories = await prisma.serviceCategory.findMany({
    include: {
      _count: {
        select: {
          services: true,
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => toAdminCategoryItem(category, locale));
}

export async function createAdminCategory(params: {
  input: AdminCategoryCreateInput;
  adminUserId: string;
  locale: Locale;
}) {
  const category = await prisma.serviceCategory.create({
    data: {
      ...buildCategoryData(params.input),
      updatedById: params.adminUserId,
    },
    include: {
      _count: {
        select: {
          services: true,
        },
      },
    },
  });

  return toAdminCategoryItem(category, params.locale);
}

export async function updateAdminCategory(params: {
  input: AdminCategoryUpdateInput;
  adminUserId: string;
  locale: Locale;
}) {
  const { id, ...inputWithoutId } = params.input;
  const parsedInput = inputWithoutId as AdminCategoryCreateInput;

  const category = await prisma.serviceCategory.update({
    where: { id },
    data: {
      ...buildCategoryData(parsedInput),
      updatedById: params.adminUserId,
    },
    include: {
      _count: {
        select: {
          services: true,
        },
      },
    },
  });

  return toAdminCategoryItem(category, params.locale);
}

export async function deleteAdminCategory(params: { id: string }) {
  const category = await prisma.serviceCategory.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      _count: {
        select: {
          services: true,
          quoteRequests: true,
          skillLinks: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError("삭제할 카테고리를 찾지 못했습니다.", 404);
  }

  const linkedCount =
    category._count.services +
    category._count.quoteRequests +
    category._count.skillLinks;

  if (linkedCount > 0) {
    throw new AppError(
      "이미 서비스나 견적 요청에 연결된 카테고리는 삭제할 수 없습니다. 비활성으로 바꿔 주세요.",
      409,
    );
  }

  await prisma.serviceCategory.delete({
    where: { id: params.id },
  });
}

