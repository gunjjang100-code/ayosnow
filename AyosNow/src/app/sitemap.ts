import type { MetadataRoute } from "next";

import { appUrl, localSeoLocations } from "@/lib/seo";
import { getLocalServicePath, localServicePages } from "@/lib/local-seo/service-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/how-it-works",
    "/promotional-videos",
    "/services",
    "/categories",
    "/quote-request",
    "/login",
    "/signup",
    "/terms",
    "/privacy",
    "/payment-refund",
    "/pro-policy",
    "/community-guidelines",
    "/cookie-policy",
    "/contact",
    ...localSeoLocations.map((location) => `/${location.slug}`),
    ...localServicePages.map((page) => getLocalServicePath(page)),
  ];

  return routes.map((route) => ({
    url: `${appUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
