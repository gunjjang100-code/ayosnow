import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PuntaGo",
    short_name: "PuntaGo",
    description: "PuntaGo home service booking and quote platform in the Philippines",
    start_url: "/",
    display: "standalone",
    background_color: "#f4fbfb",
    theme_color: "#0f172a",
    lang: "en",
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
