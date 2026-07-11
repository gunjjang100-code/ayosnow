import Link from "next/link";

import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { PageShell } from "@/components/shared/page-shell";
import { ProfessionalBadges } from "@/components/shared/professional-badges";
import { InstantBookButton } from "@/components/services/instant-book-button";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  listMarketplaceCategories,
  listMarketplaceServices,
} from "@/lib/marketplace/catalog-service";
import { canAccessCustomerMarketplace, getRoleAccessNoticeCopy } from "@/lib/role-ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Find Local Services",
  description:
    "Search PuntaGo services by category, professional, or service area. Compare verified local professionals and request fair quotations.",
  path: "/services",
});

interface ServicesPageProps {
  searchParams?: Promise<{
    category?: string;
    q?: string;
  }>;
}

function getFallbackCategoryLabel(categorySlug: string, locale: string) {
  const readableSlug = categorySlug.replace(/-/g, " ");

  if (locale === "en") {
    return readableSlug;
  }

  if (locale === "fil") {
    return readableSlug;
  }

  return readableSlug;
}

function getSearchTitle(locale: string, searchQuery: string) {
  if (locale === "fil") {
    return `Search: ${searchQuery}`;
  }

  return `Search: ${searchQuery}`;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
  const params = searchParams ? await searchParams : undefined;
  const selectedCategorySlug = params?.category;
  const searchQuery = params?.q?.trim();
  const [categories, featuredServices] = await Promise.all([
    listMarketplaceCategories(locale),
    listMarketplaceServices({ categorySlug: selectedCategorySlug, query: searchQuery, locale }),
  ]);
  const selectedCategory = categories.find(
    (category) => category.slug === selectedCategorySlug,
  );
  const selectedCategoryLabel = selectedCategory
    ? selectedCategory.name
    : selectedCategorySlug
      ? getFallbackCategoryLabel(selectedCategorySlug, locale)
      : null;

  return (
    <PageShell
      eyebrow={text.servicesEyebrow}
      title={
        searchQuery
          ? getSearchTitle(locale, searchQuery)
          : selectedCategoryLabel
            ? `${selectedCategoryLabel} · ${text.servicesTitle}`
            : text.servicesTitle
      }
      description={
        searchQuery
              ? locale === "en"
                ? "Showing services that match the service name, category, professional, or service area."
                : locale === "fil"
                  ? "Ipinapakita ang mga service na tumutugma sa pangalan, category, professional, o area."
                  : "Showing services that match the service name, category, professional, or service area."
          : selectedCategoryLabel
            ? locale === "en"
              ? `Showing services filtered to ${selectedCategoryLabel}.`
              : locale === "fil"
                ? `Ipinapakita ang mga service na naka-filter sa ${selectedCategoryLabel}.`
                : `Showing services filtered to ${selectedCategoryLabel}.`
            : text.servicesDescription
      }
    >
      {canAccessCustomerMarketplace(sessionUser.role) ? (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {searchQuery || selectedCategoryLabel ? (
            <article className="panel-shell p-5 lg:col-span-2 xl:col-span-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-teal-700">
                    {searchQuery
                      ? locale === "en"
                        ? "Search results"
                        : locale === "fil"
                          ? "Resulta ng search"
                          : "Search results"
                      : locale === "en"
                        ? "Selected category"
                        : locale === "fil"
                          ? "Napiling category"
                          : "Selected category"}
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {searchQuery ?? selectedCategoryLabel}
                  </p>
                </div>
                <Link
                  href="/services"
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {locale === "en"
                    ? "Show all services"
                    : locale === "fil"
                      ? "Ipakita lahat ng service"
                      : "Show all services"}
                </Link>
              </div>
            </article>
          ) : null}

          {featuredServices.length === 0 ? (
            <article className="panel-shell p-6 lg:col-span-2 xl:col-span-3">
              <p className="text-lg font-bold text-slate-950">
                {searchQuery
                  ? locale === "en"
                    ? "No services matched your search yet."
                    : locale === "fil"
                      ? "Wala pang service na tumugma sa search mo."
                      : "No services matched your search yet."
                  : locale === "en"
                    ? "No services are connected to this category yet."
                    : locale === "fil"
                      ? "Wala pang nakakabit na service sa category na ito."
                      : "No services are connected to this category yet."}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {locale === "en"
                  ? "Try another keyword or request multiple quotes."
                  : locale === "fil"
                    ? "Subukan ang ibang keyword o humiling ng maraming quote."
                    : "Try another keyword or request multiple quotes."}
              </p>
            </article>
          ) : null}

          {featuredServices.map((service) => (
            <article key={service.id} className="panel-shell p-5">
              <Link
                href={`/services/${service.slug}`}
                className="block rounded-3xl outline-none transition hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-teal-700">{service.location}</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">{service.title}</h2>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                    {service.priceLabel}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{service.arrival}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm font-bold text-teal-700">
                  {locale === "en"
                    ? "Open service details"
                    : locale === "fil"
                      ? "Buksan ang detalye ng service"
                      : "Open service details"}
                </p>
              </Link>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">{service.providerName}</p>
                <div className="mt-2">
                  <ProfessionalBadges badges={service.providerBadges} compact />
                </div>
                <p className="mt-1">
                  {text.servicesRatingLabel} {service.rating} / {service.reviewCount} {text.servicesReviewsSuffix}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-bold text-teal-700">{service.providerName}</span>
                <InstantBookButton locale={locale} serviceSlug={service.slug} />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <RoleAccessNotice
          {...getRoleAccessNoticeCopy({
            locale,
            currentRole: sessionUser.role,
            targetWorkspace: "customer-marketplace",
          })}
        />
      )}
    </PageShell>
  );
}
