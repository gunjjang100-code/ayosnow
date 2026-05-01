import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AyosNow",
    short_name: "AyosNow",
    description: "필리핀 홈서비스 예약·견적 플랫폼 AyosNow",
    start_url: "/",
    display: "standalone",
    background_color: "#f4fbfb",
    theme_color: "#0f172a",
    lang: "ko",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
