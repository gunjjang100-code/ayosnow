import { UserRole } from "@prisma/client";

import { ensureDemoData } from "@/lib/demo/demo-data";
import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma";

export interface TradesmanSkillCategoryOption {
  slug: string;
  name: string;
  description: string;
}

export async function listTradesmanSkillSettings(userId: string) {
  await ensureDemoData();

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
  await ensureDemoData();

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      role: true,
      fullName: true,
    },
  });

  if (!user || user.role !== UserRole.TRADESMAN) {
    throw new AppError("전문가 계정에서만 전문 기술 카테고리를 저장할 수 있습니다.", 403);
  }

  const uniqueCategorySlugs = [...new Set(params.categorySlugs.map((slug) => slug.trim()).filter(Boolean))];

  if (uniqueCategorySlugs.length === 0) {
    throw new AppError("전문 기술 카테고리를 최소 1개 이상 선택해 주세요.", 400);
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
    throw new AppError("선택한 카테고리 중 저장할 수 없는 항목이 있습니다. 다시 선택해 주세요.", 400);
  }

  const orderedCategories = uniqueCategorySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter(Boolean) as typeof categories;

  const result = await prisma.$transaction(async (tx) => {
    // 전문 프로필이 아직 없으면 기본값으로 바로 만들어 준다.
    // 이렇게 해야 전문 기술 저장부터 막히지 않고 알림 연결을 먼저 살릴 수 있다.
    const profile =
      (await tx.tradesmanProfile.findUnique({
        where: { userId: user.id },
      })) ??
      (await tx.tradesmanProfile.create({
        data: {
          userId: user.id,
          headline: `${user.fullName}님의 전문 서비스`,
          bio: "전문 기술 카테고리 설정 후 포트폴리오와 소개를 더 채워 넣을 수 있습니다.",
          experienceYears: 1,
          serviceRadiusKm: 10,
        },
      }));

    await tx.tradesmanSkill.deleteMany({
      where: {
        profileId: profile.id,
        categoryId: {
          notIn: orderedCategories.map((category) => category.id),
        },
      },
    });

    for (const category of orderedCategories) {
      await tx.tradesmanSkill.upsert({
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

    await tx.tradesmanSkill.updateMany({
      where: {
        profileId: profile.id,
      },
      data: {
        isPrimary: false,
      },
    });

    await tx.tradesmanSkill.update({
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

    const savedSkills = await tx.tradesmanSkill.findMany({
      where: { profileId: profile.id },
      include: {
        category: true,
      },
      orderBy: [{ isPrimary: "desc" }, { category: { displayOrder: "asc" } }],
    });

    return savedSkills.map((skill) => ({
      slug: skill.category.slug,
      name: skill.category.name,
    }));
  });

  return {
    savedCategories: result,
  };
}
