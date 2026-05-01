import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { getFeaturedServices, getQuoteOffers, getTradesmenProfiles } from "@/lib/constants/mock-data";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import type { Locale, TradesmanProfileData } from "@/lib/types";

interface TradesmanProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TradesmanProfilePage({
  params,
}: TradesmanProfilePageProps) {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const { slug } = await params;
  const profile =
    getTradesmenProfiles(locale).find((item) => item.slug === slug) ??
    buildFallbackTradesmanProfile(locale, slug);

  if (!profile) {
    notFound();
  }

  return (
    <PageShell
      eyebrow={text.tradesmanEyebrow}
      title={profile.name}
      description={profile.headline}
    >
      <section className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
        <article className="soft-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-2xl font-bold text-white">
              {profile.name.slice(0, 1)}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-950">{profile.name}</p>
              <p className="mt-1 text-sm text-slate-600">{profile.startingPrice}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">
              {text.tradesmanRatingLabel} {profile.rating} / {profile.reviewCount}{" "}
              {text.tradesmanReviewSuffix}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              {text.tradesmanCompletedJobs} {profile.completedJobs}
              {text.tradesmanCompletedJobsSuffix}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              {text.tradesmanResponseTime} {profile.responseTime}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-bold text-slate-900">{text.tradesmanAreas}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.serviceAreas.map((area) => (
                <span key={area} className="chip">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </article>

        <div className="grid gap-4">
          <article className="soft-card p-5">
            <p className="text-lg font-bold text-slate-950">{text.tradesmanAbout}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{profile.bio}</p>
          </article>

          <article className="soft-card p-5">
            <p className="text-lg font-bold text-slate-950">{text.tradesmanSkillsAndCredentials}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-slate-800">{text.tradesmanSkills}</p>
                <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                  {profile.skills.map((skill) => (
                    <li key={skill} className="rounded-2xl bg-slate-50 p-3">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{text.tradesmanCertificates}</p>
                <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                  {profile.certificates.map((certificate) => (
                    <li key={certificate} className="rounded-2xl bg-slate-50 p-3">
                      {certificate}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className="soft-card p-5">
            <p className="text-lg font-bold text-slate-950">{text.tradesmanPortfolio}</p>
            <div className="mt-4 grid gap-3">
              {profile.portfolio.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="soft-card p-5">
            <p className="text-lg font-bold text-slate-950">{text.tradesmanReviews}</p>
            <div className="mt-4 grid gap-3">
              {profile.reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-950">{review.author}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {text.tradesmanRatingLabel} {review.rating}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}

function buildFallbackTradesmanProfile(
  locale: Locale,
  slug: string,
): TradesmanProfileData | null {
  const serviceMatch = getFeaturedServices(locale).find((item) => item.providerSlug === slug);
  const quoteMatch = getQuoteOffers(locale).find((item) => item.tradesmanSlug === slug);

  if (!serviceMatch && !quoteMatch) {
    return null;
  }

  const localizedCopy = getFallbackProfileCopy(locale);
  const serviceTags = serviceMatch?.tags ?? [];

  // 목업 프로필이 아직 없는 전문가도 404 대신 기본 소개 화면을 보게 합니다.
  return {
    slug,
    name: serviceMatch?.providerName ?? quoteMatch?.tradesmanName ?? slug,
    headline:
      serviceMatch?.title
        ? `${serviceMatch.title} ${localizedCopy.headlineSuffix}`
        : localizedCopy.defaultHeadline,
    bio: serviceMatch
      ? `${serviceMatch.location} ${localizedCopy.bioConnector} ${serviceTags.join(", ") || localizedCopy.defaultSkillLabel}.`
      : localizedCopy.defaultBio,
    skills: serviceTags.length > 0 ? serviceTags : [localizedCopy.defaultSkillLabel],
    certificates: [localizedCopy.defaultCertificate],
    portfolio: serviceMatch
      ? [serviceMatch.title, `${serviceMatch.location} ${localizedCopy.portfolioSuffix}`]
      : [quoteMatch?.message ?? localizedCopy.defaultPortfolio],
    serviceAreas: serviceMatch ? [serviceMatch.location] : [localizedCopy.defaultArea],
    rating: quoteMatch?.rating ?? 4.8,
    reviewCount: quoteMatch ? 1 : 0,
    completedJobs: quoteMatch?.completedJobs ?? 0,
    responseTime: localizedCopy.responseTime,
    startingPrice: serviceMatch?.priceLabel ?? quoteMatch?.amountLabel ?? localizedCopy.defaultPrice,
    reviews: quoteMatch
      ? [
          {
            id: `${quoteMatch.id}-fallback-review`,
            author: localizedCopy.reviewAuthor,
            rating: quoteMatch.rating,
            comment: quoteMatch.message,
          },
        ]
      : [],
  };
}

function getFallbackProfileCopy(locale: Locale) {
  if (locale === "ko") {
    return {
      headlineSuffix: "전문가",
      defaultHeadline: "현장 요청을 빠르게 확인하고 견적을 보내는 전문가",
      bioConnector: "지역에서 활동하며 주로",
      defaultBio: "고객 요청을 검토하고 방문 가능 시간과 작업 범위를 안내하는 기본 전문가 프로필입니다.",
      defaultSkillLabel: "현장 작업",
      defaultCertificate: "기본 현장 검수 완료",
      portfolioSuffix: "현장 작업",
      defaultPortfolio: "고객 요청을 검토하고 현장 견적을 보냅니다.",
      defaultArea: "서비스 지역 확인 중",
      responseTime: "평균 15분",
      defaultPrice: "가격 협의",
      reviewAuthor: "최근 고객",
    };
  }

  if (locale === "fil") {
    return {
      headlineSuffix: "specialist",
      defaultHeadline: "Mabilis tumugon sa field requests at nagpapadala ng malinaw na quote",
      bioConnector: "na pangunahing humahawak ng",
      defaultBio: "Ito ay basic profile ng tradesman para makita agad ng customer ang saklaw at availability.",
      defaultSkillLabel: "field work",
      defaultCertificate: "Basic field review completed",
      portfolioSuffix: "service work",
      defaultPortfolio: "Sinusuri ang request ng customer at nagpapadala ng site quote.",
      defaultArea: "Area pending confirmation",
      responseTime: "Average 15 min",
      defaultPrice: "Price on request",
      reviewAuthor: "Recent customer",
    };
  }

  return {
    headlineSuffix: "specialist",
    defaultHeadline: "A field specialist who responds quickly and sends clear quotes",
    bioConnector: "and usually handles",
    defaultBio: "This is a basic tradesman profile that shows service scope and availability at a glance.",
    defaultSkillLabel: "field work",
    defaultCertificate: "Basic field review completed",
    portfolioSuffix: "service work",
    defaultPortfolio: "Reviews customer requests and sends a site quote.",
    defaultArea: "Area pending confirmation",
    responseTime: "Average 15 min",
    defaultPrice: "Price on request",
    reviewAuthor: "Recent customer",
  };
}
