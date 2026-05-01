import { redirect } from "next/navigation";
import Link from "next/link";

import { HomeCategoryChips } from "@/components/home/home-category-chips";
import { InfoCard } from "@/components/shared/info-card";
import { StatCard } from "@/components/shared/stat-card";
import { getDemoSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  listMarketplaceCategories,
  listMarketplaceServices,
  listOpenQuoteRequestPreviews,
} from "@/lib/marketplace/catalog-service";
import { getRoleHomePath } from "@/lib/role-ui";

export default async function HomePage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getDemoSessionUser();

  if (sessionUser.role !== "customer") {
    redirect(getRoleHomePath(sessionUser.role));
  }

  const [categories, featuredServices, quoteRequests] = await Promise.all([
    listMarketplaceCategories(locale),
    listMarketplaceServices({ take: 2 }),
    listOpenQuoteRequestPreviews(locale, 2),
  ]);
  const quoteRequestHref = sessionUser.token ? "/quote-request" : "/login?callbackUrl=/quote-request";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="glass-card overflow-hidden p-6 md:p-8 lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <span className="eyebrow-pill">{text.homeEyebrow}</span>
            <h1 className="section-title max-w-3xl">
              <span className="block">{text.homeTitleTop}</span>
              <span className="mt-2 block text-teal-800">
                {text.homeTitleAccent}
                {text.homeTitleBottom ? ` ${text.homeTitleBottom}` : ""}
              </span>
            </h1>
            <p className="section-copy mt-5 max-w-2xl">{text.homeDescription}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-bold !text-white shadow-[0_16px_32px_-18px_rgba(15,23,42,0.85)] transition hover:-translate-y-0.5 hover:bg-slate-800 hover:!text-white focus-visible:!text-white"
              >
                {text.homePrimaryCta}
              </Link>
              <Link
                href={quoteRequestHref}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              >
                {text.homeSecondaryCta}
              </Link>
            </div>

            {categories.length > 0 ? (
              <HomeCategoryChips key={locale} initialCategories={categories} />
            ) : (
              <p className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                등록된 카테고리가 아직 없습니다. 관리자에서 카테고리를 먼저 추가해 주세요.
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatCard
                label={text.homeCustomerValueLabel}
                value={text.homeCustomerValue}
                helper={text.homeCustomerHelper}
              />
              <StatCard
                label={text.homeTradesmanValueLabel}
                value={text.homeTradesmanValue}
                helper={text.homeTradesmanHelper}
              />
              <StatCard
                label={text.homeAdminValueLabel}
                value={text.homeAdminValue}
                helper={text.homeAdminHelper}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-sm font-semibold text-slate-300">{text.instantFlowTitle}</p>
              <p className="mt-2 text-2xl font-black">{text.instantFlowValue}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{text.instantFlowDescription}</p>
            </div>
            <div className="rounded-3xl bg-teal-50 p-5">
              <p className="text-sm font-semibold text-teal-800">{text.quoteFlowTitle}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{text.quoteFlowValue}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{text.quoteFlowDescription}</p>
            </div>
            <div className="panel-shell grid gap-3 p-5">
              {[
                text.homeStep1,
                text.homeStep2,
                text.homeStep3,
                text.homeStep4,
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-teal-700">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-6 text-slate-800">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          title={text.homeFeaturedTitle}
          description={text.homeFeaturedDescription}
        >
          <div className="grid gap-4">
            {featuredServices.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                아직 공개된 서비스가 없습니다. 전문가가 서비스를 등록하면 이 영역에 자동으로 표시됩니다.
              </p>
            ) : null}
            {featuredServices.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="block rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_36px_-26px_rgba(13,148,136,0.35)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-slate-950">{service.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {service.providerName} · {service.location}
                    </p>
                  </div>
                  <span className="chip">{service.priceLabel}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{service.arrival}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {text.homeReviewLabel} {service.rating} / {text.homeReviewCountSuffix} {service.reviewCount}
                  </p>
                  <span className="text-sm font-bold text-teal-700">{text.homeExpertLink}</span>
                </div>
              </Link>
            ))}
          </div>
        </InfoCard>

        <InfoCard
          title={text.homeOpenRequestsTitle}
          description={text.homeOpenRequestsDescription}
        >
          <div className="grid gap-4">
            {quoteRequests.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                아직 열린 견적 요청이 없습니다. 고객이 요청을 등록하면 이 영역에 표시됩니다.
              </p>
            ) : null}
            {quoteRequests.map((request) => (
              <Link
                key={request.id}
                href={`/quote-requests/${request.id}`}
                className="block rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_36px_-26px_rgba(13,148,136,0.35)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-slate-950">{request.serviceName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {request.location} · {request.targetDate}
                    </p>
                  </div>
                  <span className="chip">{request.budgetLabel}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{request.summary}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    {text.homeQuotesReceived} {request.bidsCount}
                  </span>
                  <span className="font-bold text-teal-700">{text.homeCompareQuotes}</span>
                </div>
              </Link>
            ))}
          </div>
        </InfoCard>
      </section>

    </div>
  );
}
