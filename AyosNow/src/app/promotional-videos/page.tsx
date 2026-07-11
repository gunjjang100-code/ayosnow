import { PromotionalVideoGrid } from "@/components/promotional-videos/promotional-video-grid";
import { PageShell } from "@/components/shared/page-shell";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  buildYouTubeEmbedUrl,
  getPromotionalVideoUrls,
} from "@/lib/promotional-videos/promotional-video-service";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Promotional Videos",
  description:
    "Watch PuntaGo promotional and tutorial videos to learn how customers and professionals use the platform.",
  path: "/promotional-videos",
});

export default async function PromotionalVideosPage() {
  const locale = await getCurrentLocale();
  const publicLocale = locale === "fil" ? "fil" : "en";
  const text =
    publicLocale === "fil"
      ? {
          eyebrow: "Mga Video ng PuntaGo",
          title: "Panoorin kung paano ginagamit ang PuntaGo.",
          description:
            "Narito ang promotional at tutorial videos para sa customers at professionals.",
          videoTitle: "PuntaGo video",
          emptyTitle: "Inihahanda pa ang mga video.",
          emptyDescription:
            "Bumalik muli sa ibang araw para sa mga bagong tutorial at promotional video ng PuntaGo.",
        }
      : {
          eyebrow: "PuntaGo Videos",
          title: "See how PuntaGo works in action.",
          description:
            "Watch promotional and tutorial videos made for PuntaGo customers and professionals.",
          videoTitle: "PuntaGo video",
          emptyTitle: "Videos are being prepared.",
          emptyDescription:
            "Check back soon for new PuntaGo promotional videos and step-by-step tutorials.",
        };
  const videoUrls = await getPromotionalVideoUrls();
  const videos = videoUrls.flatMap((url, index) => {
    if (!url) {
      return [];
    }

    const embedUrl = buildYouTubeEmbedUrl(url);
    return embedUrl
      ? [
          {
            embedUrl,
            title: `${text.videoTitle} ${index + 1}`,
          },
        ]
      : [];
  });

  return (
    <PageShell
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
    >
      <PromotionalVideoGrid
        videos={videos}
        emptyTitle={text.emptyTitle}
        emptyDescription={text.emptyDescription}
      />
    </PageShell>
  );
}
