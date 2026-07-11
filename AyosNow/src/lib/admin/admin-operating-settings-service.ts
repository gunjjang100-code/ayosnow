import { AdminPublicationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getActiveReferralSetting } from "@/lib/referrals/referral-service";
import type { ReferralSettingUpdateInput } from "@/lib/validations/admin-settings";

export async function getAdminOperatingSettings() {
  const [referral, bannerTotal, activeBannerCount, featuredCategories, rankedCategories] =
    await Promise.all([
      getActiveReferralSetting(),
      prisma.adminBanner.count(),
      prisma.adminBanner.count({
        where: { status: AdminPublicationStatus.ACTIVE },
      }),
      prisma.serviceCategory.count({
        where: {
          isActive: true,
          featured: true,
        },
      }),
      prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        take: 6,
        select: {
          id: true,
          name: true,
          nameKo: true,
          nameFil: true,
          nameEn: true,
          displayOrder: true,
          featured: true,
        },
      }),
    ]);

  return {
    referral,
    banners: {
      total: bannerTotal,
      active: activeBannerCount,
    },
    emergency: {
      featuredCategoryCount: featuredCategories,
    },
    ranking: rankedCategories.map((category) => ({
      id: category.id,
      name: category.nameEn ?? category.nameFil ?? category.name,
      displayOrder: category.displayOrder,
      featured: category.featured,
    })),
  };
}

export async function updateReferralSetting(params: {
  input: ReferralSettingUpdateInput;
  adminUserId: string;
}) {
  return prisma.referralSetting.create({
    data: {
      rewardCredits: params.input.rewardCredits,
      isActive: params.input.isActive,
      updatedById: params.adminUserId,
    },
  });
}
