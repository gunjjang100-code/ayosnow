import { UserRole } from "@prisma/client";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";

export interface TradesmanSkillCategoryOption {
  slug: string;
  name: string;
  description: string;
}

export async function listTradesmanSkillSettings(userId: string) {
  const [categories, profile] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.tradesmanProfile.findUnique({
      where: { userId },
      include: {
        skillLinks: {
          include: {
            category: true,
          },
          orderBy: [{ isPrimary: "desc" }, { years: "desc" }],
        },
      },
    }),
  ]);

  return {
    categories: categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description,
    })),
    selectedCategorySlugs: profile?.skillLinks.map((skill) => skill.category.slug) ?? [],
  };
}

export async function updateTradesmanSkillSettings(params: {
  userId: string;
  categorySlugs: string[];
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      role: true,
      fullName: true,
    },
  });

  if (!user || user.role !== UserRole.TRADESMAN) {
    throw new AppError("Only professional accounts can save specialty categories.", 403);
  }

  const uniqueCategorySlugs = [...new Set(params.categorySlugs.map((slug) => slug.trim()).filter(Boolean))];

  if (uniqueCategorySlugs.length === 0) {
    throw new AppError("Select at least one specialty category.", 400);
  }

  const categories = await prisma.serviceCategory.findMany({
    where: {
      slug: {
        in: uniqueCategorySlugs,
      },
      isActive: true,
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  if (categories.length !== uniqueCategorySlugs.length) {
    throw new AppError("One or more selected categories cannot be saved. Please choose again.", 400);
  }

  const orderedCategories = uniqueCategorySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter(Boolean) as typeof categories;

  // 전문 프로필이 아직 없으면 기본값으로 바로 만들어 준다.
  // D1에서는 긴 트랜잭션보다 작은 저장 작업을 순서대로 실행하는 방식이 더 안정적이다.
  const profile =
    (await prisma.tradesmanProfile.findUnique({
      where: { userId: user.id },
    })) ??
    (await prisma.tradesmanProfile.create({
      data: {
        userId: user.id,
        headline: `${user.fullName}'s professional services`,
        bio: "You can add portfolio items and a stronger introduction after choosing specialty categories.",
        experienceYears: 1,
        serviceRadiusKm: 10,
      },
    }));

  await prisma.tradesmanSkill.deleteMany({
    where: {
      profileId: profile.id,
      categoryId: {
        notIn: orderedCategories.map((category) => category.id),
      },
    },
  });

  for (const category of orderedCategories) {
    await prisma.tradesmanSkill.upsert({
      where: {
        profileId_categoryId: {
          profileId: profile.id,
          categoryId: category.id,
        },
      },
      update: {
        isPrimary: false,
      },
      create: {
        profileId: profile.id,
        categoryId: category.id,
        years: 1,
        isPrimary: false,
      },
    });
  }

  await prisma.tradesmanSkill.updateMany({
    where: {
      profileId: profile.id,
    },
    data: {
      isPrimary: false,
    },
  });

  await prisma.tradesmanSkill.update({
    where: {
      profileId_categoryId: {
        profileId: profile.id,
        categoryId: orderedCategories[0].id,
      },
    },
    data: {
      isPrimary: true,
    },
  });

  const savedSkills = await prisma.tradesmanSkill.findMany({
    where: { profileId: profile.id },
    include: {
      category: true,
    },
    orderBy: [{ isPrimary: "desc" }, { category: { displayOrder: "asc" } }],
  });

  return {
    savedCategories: savedSkills.map((skill) => ({
      slug: skill.category.slug,
      name: skill.category.name,
    })),
  };
}
