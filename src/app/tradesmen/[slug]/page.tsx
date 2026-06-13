import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { getTradesmanProfileBySlug } from "@/lib/tradesmen/tradesman-profile-service";

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
  const profile = await getTradesmanProfileBySlug(slug, locale);

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
