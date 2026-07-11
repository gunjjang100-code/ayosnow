import type { MetadataRoute } from "next";

const appUrl = (process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://puntago.net").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/dashboard", "/settlements"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
