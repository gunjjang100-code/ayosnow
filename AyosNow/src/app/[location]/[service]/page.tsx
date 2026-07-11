import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import {
  buildLocalServiceStructuredData,
  getLocalServicePage,
  getLocalServicePath,
  getLocalServiceStaticParams,
  getRelatedLocalServicePages,
} from "@/lib/local-seo/service-pages";
import { createPageMetadata } from "@/lib/seo";

interface LocalServicePageProps {
  params: Promise<{
    location: string;
    service: string;
  }>;
}

// Next.js only builds these five allowlisted paths; every other pair is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getLocalServiceStaticParams();
}

export async function generateMetadata({ params }: LocalServicePageProps): Promise<Metadata> {
  const { location, service } = await params;
  const page = getLocalServicePage(location, service);

  if (!page) {
    notFound();
  }

  return createPageMetadata({
    title: page.metadataTitle,
    description: page.metadataDescription,
    path: getLocalServicePath(page),
  });
}

export default async function LocalServicePage({ params }: LocalServicePageProps) {
  const { location, service } = await params;
  const page = getLocalServicePage(location, service);

  if (!page) {
    notFound();
  }

  const relatedPages = getRelatedLocalServicePages(page);
  const structuredData = buildLocalServiceStructuredData(page);

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <PageShell
        eyebrow={`${page.service.name} - ${page.location.name}`}
        title={page.headline}
        description={page.introduction}
      >
        <nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-teal-700">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/${page.location.slug}`}
                className="transition hover:text-teal-700"
              >
                {page.location.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-slate-950">
              {page.service.name}
            </li>
          </ol>
        </nav>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="panel-shell p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              Common requests
            </p>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              {page.service.name} in {page.location.name}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{page.overview}</p>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
              {page.commonJobs.map((job) => (
                <li key={job} className="flex gap-3">
                  <span aria-hidden="true" className="font-black text-teal-700">
                    +
                  </span>
                  <span>{job}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel-shell p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              Request local help
            </p>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Compare professionals for your job
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Describe the work you need, review available local options, and choose the next step
              that fits your schedule and budget.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/services?q=${encodeURIComponent(page.service.searchQuery)}`}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-teal-700 px-5 text-sm font-black !text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 active:scale-[0.98]"
              >
                Find professionals
              </Link>
              <Link
                href="/quote-request"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 active:scale-[0.98]"
              >
                Request quotes
              </Link>
            </div>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="panel-shell p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              Across Pangasinan
            </p>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Plan the request around your location
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{page.localContext}</p>
          </article>

          <article className="panel-shell p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              Before you request quotes
            </p>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Help professionals understand the job
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {page.requestTips.map((tip) => (
                <div key={tip.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-black text-slate-950">{tip.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{tip.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel-shell p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
            Compare carefully
          </p>
          <h2 className="mt-4 text-2xl font-black text-slate-950">
            What to check before choosing a professional
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
            {page.choosingProfessional}
          </p>
        </section>

        <section className="panel-shell p-5 sm:p-7" aria-labelledby="service-faqs">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
            Helpful answers
          </p>
          <h2 id="service-faqs" className="mt-4 text-2xl font-black text-slate-950">
            Questions about {page.service.name.toLowerCase()}
          </h2>
          <div className="mt-5 grid gap-3">
            {page.faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-black text-slate-950 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span aria-hidden="true" className="text-xl text-teal-700 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="related-local-services">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
                More local services
              </p>
              <h2 id="related-local-services" className="mt-2 text-2xl font-black text-slate-950">
                Other help available in {page.location.name}
              </h2>
            </div>
            <Link
              href={`/${page.location.slug}`}
              className="inline-flex min-h-11 items-center text-sm font-black text-teal-700 transition hover:text-teal-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
            >
              View Pangasinan services
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedPages.map((relatedPage) => (
              <Link
                key={relatedPage.service.slug}
                href={getLocalServicePath(relatedPage)}
                className="soft-card min-h-24 p-5 transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 active:scale-[0.99]"
              >
                <p className="text-sm font-black text-slate-950">
                  {relatedPage.service.name}
                </p>
                <p className="mt-2 text-xs font-bold text-teal-700">
                  {relatedPage.location.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  );
}
