import Link from "next/link";

import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { PageShell } from "@/components/shared/page-shell";
import { InstantBookButton } from "@/components/services/instant-book-button";
import { getDemoSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  listMarketplaceCategories,
  listMarketplaceServices,
} from "@/lib/marketplace/catalog-service";
import { canAccessCustomerMarketplace, getRoleAccessNoticeCopy } from "@/lib/role-ui";

interface ServicesPageProps {
  searchParams?: Promise<{
    category?: string;
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

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getDemoSessionUser();
  const params = searchParams ? await searchParams : undefined;
  const selectedCategorySlug = params?.category;
  const [categories, featuredServices] = await Promise.all([
    listMarketplaceCategories(locale),
    listMarketplaceServices({ categorySlug: selectedCategorySlug }),
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
        selectedCategoryLabel
          ? `${selectedCategoryLabel} · ${text.servicesTitle}`
          : text.servicesTitle
      }
      description={
        selectedCategoryLabel
          ? locale === "en"
            ? `Showing services filtered to ${selectedCategoryLabel}.`
            : locale === "fil"
              ? `Ipinapakita ang mga service na naka-filter sa ${selectedCategoryLabel}.`
              : `${selectedCategoryLabel} 카테고리로 필터된 서비스만 보여주고 있습니다.`
          : text.servicesDescription
      }
    >
      {canAccessCustomerMarketplace(sessionUser.role) ? (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {selectedCategoryLabel ? (
            <article className="panel-shell p-5 lg:col-span-2 xl:col-span-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-teal-700">
                    {locale === "en"
                      ? "Selected category"
                      : locale === "fil"
                        ? "Napiling category"
                        : "선택한 카테고리"}
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-950">{selectedCategoryLabel}</p>
                </div>
                <Link
                  href="/services"
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {locale === "en"
                    ? "Show all services"
                    : locale === "fil"
                      ? "Ipakita lahat ng service"
                      : "전체 서비스 보기"}
                </Link>
              </div>
            </article>
          ) : null}

          {featuredServices.length === 0 ? (
            <article className="panel-shell p-6 lg:col-span-2 xl:col-span-3">
              <p className="text-lg font-bold text-slate-950">
                {locale === "en"
                  ? "No services are connected to this category yet."
                  : locale === "fil"
                    ? "Wala pang nakakabit na service sa category na ito."
                    : "이 카테고리에 연결된 서비스가 아직 없습니다."}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {locale === "en"
                  ? "This usually means the category exists first and the actual service cards will be added next."
                  : locale === "fil"
                    ? "Karaniwan, nauuna munang gawin ang category bago idagdag ang totoong service cards."
                    : "보통 카테고리를 먼저 만들고, 그 다음에 실제 서비스 카드를 연결하는 흐름입니다."}
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
                      : "서비스 상세 보기"}
                </p>
              </Link>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">{service.providerName}</p>
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
