import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";

import { PremiumHomePage } from "@/components/home/premium-homepage";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  listMarketplaceCategories,
  listMarketplaceServices,
  listRecentReviewPreviews,
  getMarketplaceStats,
} from "@/lib/marketplace/catalog-service";
import { getRoleHomePath } from "@/lib/role-ui";
import { buildHomeStructuredData, createPageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/types";

export const metadata = createPageMetadata({
  title: "Find Trusted Local Professionals Near You",
  description:
    "Starting in Pangasinan. Built for the Philippines. Find verified local professionals, compare fair quotations, book services, chat safely, and manage everyday local work with PuntaGo.",
  path: "/",
});

const getCachedHomeData = unstable_cache(
  async (locale: Locale) =>
    Promise.all([
      listMarketplaceCategories(locale),
      listMarketplaceServices({ take: 6, locale }),
      listRecentReviewPreviews(6),
      getMarketplaceStats(),
    ]),
  ["puntago-home-marketplace-data"],
  {
    revalidate: 300,
    tags: ["puntago-home-marketplace-data"],
  },
);

export default async function HomePage() {
  const locale = await getCurrentLocale();
  const publicLocale = locale === "fil" ? "fil" : "en";
  const sessionUser = await getOptionalSessionUser();

  if (sessionUser.role !== "customer") {
    redirect(getRoleHomePath(sessionUser.role));
  }

  const [categories, featuredServices, reviews, marketplaceStats] = await getCachedHomeData(publicLocale);
  const quoteRequestHref = sessionUser.token ? "/quote-request" : "/login?callbackUrl=/quote-request";
  const structuredData = buildHomeStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PremiumHomePage
        locale={publicLocale}
        categories={categories}
        featuredServices={featuredServices}
        reviews={reviews}
        marketplaceStats={marketplaceStats}
        quoteRequestHref={quoteRequestHref}
      />
    </>
  );
}
