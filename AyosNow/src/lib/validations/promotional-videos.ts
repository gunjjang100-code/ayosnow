import { z } from "zod";

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

export const MAX_PROMOTIONAL_VIDEO_URL_LENGTH = 500;

export type PromotionalVideoUrls = [string, string, string];

/**
 * 지원하는 YouTube 주소에서 11자리 영상 ID만 꺼낸다.
 * 주소의 호스트와 경로를 각각 확인하므로 youtube.com을 흉내 낸 가짜 호스트는 통과하지 못한다.
 */
export function extractYouTubeVideoId(value: string): string | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.port || url.username || url.password) {
    return null;
  }

  let videoId: string | null = null;

  if (url.hostname === "youtu.be") {
    const shortLinkMatch = url.pathname.match(/^\/([^/]+)\/?$/);
    videoId = shortLinkMatch?.[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const pathMatch = url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)\/?$/);
      videoId = pathMatch?.[1] ?? null;
    }
  }

  return videoId && YOUTUBE_VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
}

export function createCanonicalYouTubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function createYouTubeNoCookieEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/** 검증된 YouTube URL을 화면에서 쓸 개인정보 보호 임베드 주소로 바꾼다. */
export function buildYouTubeEmbedUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? createYouTubeNoCookieEmbedUrl(videoId) : "";
}

const promotionalVideoUrlSchema = z
  .string()
  .trim()
  .max(
    MAX_PROMOTIONAL_VIDEO_URL_LENGTH,
    `Each video URL must be ${MAX_PROMOTIONAL_VIDEO_URL_LENGTH} characters or fewer.`,
  )
  .transform((value, context) => {
    if (value === "") {
      return value;
    }

    const videoId = extractYouTubeVideoId(value);

    if (!videoId) {
      context.addIssue({
        code: "custom",
        message: "Use a valid HTTPS YouTube watch, short, Shorts, or embed URL.",
      });
      return z.NEVER;
    }

    return createCanonicalYouTubeUrl(videoId);
  });

export const promotionalVideoSettingsUpdateSchema = z
  .object({
    videoUrls: z.tuple([
      promotionalVideoUrlSchema,
      promotionalVideoUrlSchema,
      promotionalVideoUrlSchema,
    ]),
  })
  .strict()
  .superRefine((value, context) => {
    const usedVideoIds = new Set<string>();

    value.videoUrls.forEach((url, index) => {
      if (!url) {
        return;
      }

      const videoId = extractYouTubeVideoId(url);

      if (videoId && usedVideoIds.has(videoId)) {
        context.addIssue({
          code: "custom",
          path: ["videoUrls", index],
          message: "The same YouTube video cannot be used more than once.",
        });
      }

      if (videoId) {
        usedVideoIds.add(videoId);
      }
    });
  });

export type PromotionalVideoSettingsUpdateInput = z.infer<
  typeof promotionalVideoSettingsUpdateSchema
>;
