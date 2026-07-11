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

  return isActive ? "Live" : "Hidden";
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
    // Public service lists still read name/description directly,
    // so the representative values must use the production default language.
    name: input.nameEn,
    description: input.descriptionEn,
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
    throw new AppError("Category to delete was not found.", 404);
  }

  const linkedCount =
    category._count.services +
    category._count.quoteRequests +
    category._count.skillLinks;

  if (linkedCount > 0) {
    throw new AppError(
      "Categories already connected to services or quote requests cannot be deleted. Deactivate the category instead.",
      409,
    );
  }

  await prisma.serviceCategory.delete({
    where: { id: params.id },
  });
}
