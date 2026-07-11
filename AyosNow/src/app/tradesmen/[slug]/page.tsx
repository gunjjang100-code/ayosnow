import { notFound } from "next/navigation";
import Image from "next/image";

import { PageShell } from "@/components/shared/page-shell";
import { ProfessionalBadges } from "@/components/shared/professional-badges";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { getTradesmanProfileBySlug } from "@/lib/tradesmen/tradesman-profile-service";

interface TradesmanProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatProfileDate(value: string | null, locale: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "fil" ? "fil-PH" : "en-US", {
    year: "numeric",
    month: "short",
  }).format(new Date(value));
}

function getFaqItems(locale: string) {
  if (locale === "en") {
    return [
      {
        question: "Can I chat before booking?",
        answer: "Yes. Use the chat button after a request or booking is connected.",
      },
      {
        question: "How is pricing confirmed?",
        answer: "The professional can send a quote, and you can compare before choosing.",
      },
      {
        question: "What should I prepare?",
        answer: "Share photos, location details, preferred schedule, and any urgent notes.",
      },
    ];
  }

  if (locale === "fil") {
    return [
      {
        question: "Puwede ba akong mag-chat bago mag-book?",
        answer: "Oo. Gamitin ang chat kapag nakakonekta na ang request o booking.",
      },
      {
        question: "Paano kinukumpirma ang presyo?",
        answer: "Magpapadala ang professional ng quote at puwede mo itong ikumpara bago pumili.",
      },
      {
        question: "Ano ang dapat ihanda?",
        answer: "Magpadala ng photos, location details, preferred schedule, at urgent notes.",
      },
    ];
  }

  return getFaqItems("en");
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
  const faqItems = getFaqItems(locale);

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
              <div className="mt-2">
                <ProfessionalBadges badges={profile.badges} />
              </div>
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
                    <li key={certificate.id} className="rounded-2xl bg-slate-50 p-3">
                      <p className="font-bold text-slate-900">{certificate.title}</p>
                      {certificate.issuer ? (
                        <p className="mt-1 text-xs text-slate-500">{certificate.issuer}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-500">
                        {formatProfileDate(certificate.acquiredAt, locale) ?? "Issue date pending"}
                        {certificate.expiresAt
                          ? ` · expires ${formatProfileDate(certificate.expiresAt, locale)}`
                          : ""}
                      </p>
                      {certificate.fileUrl ? (
                        <a
                          href={certificate.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex min-h-9 items-center rounded-full bg-white px-3 text-xs font-black text-teal-800 transition hover:bg-teal-50"
                        >
                          View certificate
                        </a>
                      ) : null}
                    </li>
                  ))}
                  {profile.certificates.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
                      No certificates are available yet.
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </article>

          <article className="soft-card p-5">
            <p className="text-lg font-bold text-slate-950">{text.tradesmanPortfolio}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {profile.portfolio.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={520}
                      height={320}
                      unoptimized
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-slate-100 text-sm font-bold text-slate-500">
                      Work photo pending
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-bold text-slate-950">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
              {profile.portfolio.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No portfolio photos are available yet.
                </div>
              ) : null}
            </div>
          </article>

          <article className="soft-card p-5">
            <p className="text-lg font-bold text-slate-950">FAQ</p>
            <div className="mt-4 grid gap-3">
              {faqItems.map((item) => (
                <details key={item.question} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-bold text-slate-950">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
                </details>
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
                  {review.photoUrl ? (
                    <Image
                      src={review.photoUrl}
                      alt={`${review.author} review`}
                      width={480}
                      height={280}
                      unoptimized
                      className="mt-3 max-h-56 rounded-2xl object-cover"
                    />
                  ) : null}
                  <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>
                </div>
              ))}
              {profile.reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No reviews are available yet.
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
