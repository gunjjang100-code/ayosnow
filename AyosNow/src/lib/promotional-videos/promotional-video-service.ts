import { prisma } from "@/lib/prisma";
import {
  promotionalVideoSettingsUpdateSchema,
  type PromotionalVideoUrls,
} from "@/lib/validations/promotional-videos";

export { buildYouTubeEmbedUrl } from "@/lib/validations/promotional-videos";

export type PromotionalVideoSettings = {
  videoUrls: PromotionalVideoUrls;
};

type PromotionalVideoSettingRow = {
  video1Url: string | null;
  video2Url: string | null;
  video3Url: string | null;
};

function emptyVideoUrls(): PromotionalVideoUrls {
  return ["", "", ""];
}

function toSettings(row: PromotionalVideoSettingRow | null): PromotionalVideoSettings {
  const videoUrls: PromotionalVideoUrls = row
    ? [row.video1Url ?? "", row.video2Url ?? "", row.video3Url ?? ""]
    : emptyVideoUrls();

  return {
    videoUrls,
  };
}

/** 최신 스냅샷 한 건을 읽고, 아직 저장된 값이 없으면 빈 세 칸을 돌려준다. */
export async function getPromotionalVideoUrls(): Promise<PromotionalVideoUrls> {
  const latest = await prisma.promotionalVideoSetting.findFirst({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      video1Url: true,
      video2Url: true,
      video3Url: true,
    },
  });

  return toSettings(latest).videoUrls;
}

export async function getPromotionalVideoSettings(): Promise<PromotionalVideoSettings> {
  return { videoUrls: await getPromotionalVideoUrls() };
}

/** 기존 행을 수정하지 않고 새 행을 만들어 변경 이력을 보존한다. */
export async function savePromotionalVideoSettings(params: {
  videoUrls: PromotionalVideoUrls;
  adminUserId: string;
}): Promise<PromotionalVideoSettings> {
  // API 밖에서 이 함수를 직접 호출해도 잘못된 URL이 DB에 들어가지 않도록 한 번 더 검사한다.
  const input = promotionalVideoSettingsUpdateSchema.parse({ videoUrls: params.videoUrls });
  const [video1Url, video2Url, video3Url] = input.videoUrls;

  const created = await prisma.promotionalVideoSetting.create({
    data: {
      video1Url: video1Url || null,
      video2Url: video2Url || null,
      video3Url: video3Url || null,
      updatedById: params.adminUserId,
    },
    select: {
      video1Url: true,
      video2Url: true,
      video3Url: true,
    },
  });

  return toSettings(created);
}
