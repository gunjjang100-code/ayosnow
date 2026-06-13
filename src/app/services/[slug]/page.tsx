import Link from "next/link";
import { notFound } from "next/navigation";

import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { PageShell } from "@/components/shared/page-shell";
import { InstantBookButton } from "@/components/services/instant-book-button";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  getMarketplaceServiceBySlug,
  listMarketplaceCategories,
  listMarketplaceServices,
} from "@/lib/marketplace/catalog-service";
import { canAccessCustomerMarketplace, getRoleAccessNoticeCopy } from "@/lib/role-ui";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
  const service = await getMarketplaceServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const categories = await listMarketplaceCategories(locale);
  const allServices = await listMarketplaceServices({ categorySlug: service.categorySlug });
  const category = categories.find((item) => item.slug === service.categorySlug);
  const relatedServices = allServices.filter(
    (item) => item.categorySlug === service.categorySlug && item.slug !== service.slug,
  );

  return (
    <PageShell
      eyebrow={text.servicesEyebrow}
      title={service.title}
      description={
        locale === "en"
          ? `${service.location} · ${service.priceLabel} · ${service.arrival}`
          : locale === "fil"
            ? `${service.location} · ${service.priceLabel} · ${service.arrival}`
            : `${service.location} · ${service.priceLabel} · ${service.arrival}`
      }
    >
      {canAccessCustomerMarketplace(sessionUser.role) ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
            <article className="panel-shell p-6">
              <p className="text-sm font-bold text-teal-700">
                {locale === "en"
                  ? "Service summary"
                  : locale === "fil"
                    ? "Buod ng service"
                    : "서비스 요약"}
              </p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                {locale === "en"
                  ? `This service is designed for customers who want a faster booking flow without waiting for several quotes. The tradesman can confirm the visit quickly because the work scope is already clear.`
                  : locale === "fil"
                    ? `Ang service na ito ay para sa mga customer na gusto ng mas mabilis na booking flow nang hindi na naghihintay ng maraming quote. Mas mabilis makakapag-confirm ang tradesman dahil malinaw na agad ang scope ng trabaho.`
                    : `이 서비스는 여러 견적을 기다리지 않고 바로 예약 흐름으로 들어가고 싶은 고객에게 맞춘 카드입니다. 작업 범위가 비교적 명확해서 전문가도 방문 가능 시간을 더 빠르게 확정할 수 있습니다.`}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    {locale === "en"
                      ? "Category"
                      : locale === "fil"
                        ? "Category"
                        : "카테고리"}
                  </p>
                  <p className="mt-2 text-base font-bold text-slate-950">
                    {category?.name ?? service.categorySlug}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    {locale === "en"
                      ? "Provider"
                      : locale === "fil"
                        ? "Provider"
                        : "전문가"}
                  </p>
                  <p className="mt-2 text-base font-bold text-slate-950">{service.providerName}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-teal-700">
                  {locale === "en"
                    ? "Included points"
                    : locale === "fil"
                      ? "Kasamang puntos"
                      : "포함 포인트"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <article className="panel-shell p-6">
              <p className="text-sm font-bold text-teal-700">
                {locale === "en"
                  ? "Booking"
                  : locale === "fil"
                    ? "Booking"
                    : "예약"}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {locale === "en"
                  ? `The provider is ${service.providerName}, and this card uses the same instant booking flow as the service list.`
                  : locale === "fil"
                    ? `Si ${service.providerName} ang provider ng service na ito, at pareho ang instant booking flow nito sa service list.`
                    : `이 서비스는 ${service.providerName} 전문가가 제공하며, 서비스 목록과 같은 즉시 예약 흐름을 그대로 사용합니다.`}
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {locale === "en"
                    ? "Expected timing"
                    : locale === "fil"
                      ? "Inaasahang oras"
                      : "예상 방문"}
                </p>
                <p className="mt-2 text-base font-bold text-slate-950">{service.arrival}</p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {locale === "en"
                    ? "Price range"
                    : locale === "fil"
                      ? "Presyo"
                      : "가격 범위"}
                </p>
                <p className="mt-2 text-base font-bold text-slate-950">{service.priceLabel}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <InstantBookButton locale={locale} serviceSlug={service.slug} />
                <Link
                  href="/quote-request"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {text.homeSecondaryCta}
                </Link>
              </div>
            </article>
          </section>

          {relatedServices.length > 0 ? (
            <section className="grid gap-4">
              <article className="panel-shell p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-teal-700">
                      {locale === "en"
                        ? "Related services"
                        : locale === "fil"
                          ? "Kaugnay na services"
                          : "비슷한 서비스"}
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {locale === "en"
                        ? "You can compare nearby options in the same category."
                        : locale === "fil"
                          ? "Puwede mong ikumpara ang ibang option sa parehong category."
                          : "같은 카테고리의 다른 서비스도 비교할 수 있습니다."}
                    </p>
                  </div>
                  <Link
                    href={`/services?category=${service.categorySlug}`}
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {locale === "en"
                      ? "Back to category list"
                      : locale === "fil"
                        ? "Balik sa category list"
                        : "카테고리 목록으로 돌아가기"}
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {relatedServices.map((item) => (
                    <Link
                      key={item.id}
                      href={`/services/${item.slug}`}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <p className="text-sm font-semibold text-teal-700">{item.location}</p>
                      <p className="mt-2 text-lg font-bold text-slate-950">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.arrival}</p>
                    </Link>
                  ))}
                </div>
              </article>
            </section>
          ) : null}
        </>
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
