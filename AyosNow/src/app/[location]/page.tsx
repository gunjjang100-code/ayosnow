import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  getLocalServicePath,
  localServicePages,
} from "@/lib/local-seo/service-pages";
import {
  buildLocalStructuredData,
  createPageMetadata,
  localSeoLocations,
  professionalCategoryGroups,
} from "@/lib/seo";

type LocationSlug = (typeof localSeoLocations)[number]["slug"];

interface LocalSeoPageProps {
  params: Promise<{
    location: string;
  }>;
}

function getLocation(slug: string) {
  return localSeoLocations.find((location) => location.slug === slug);
}

function getStatusLabel(status: (typeof localSeoLocations)[number]["status"]) {
  if (status === "now-serving") {
    return "Now serving";
  }

  if (status === "coming-soon") {
    return "Coming soon";
  }

  return "Future market";
}

export function generateStaticParams() {
  return localSeoLocations.map((location) => ({
    location: location.slug,
  }));
}

export async function generateMetadata({ params }: LocalSeoPageProps): Promise<Metadata> {
  const { location: locationSlug } = await params;
  const location = getLocation(locationSlug);

  if (!location) {
    return {};
  }

  return createPageMetadata({
    title: `${location.name} Local Services`,
    description: location.description,
    path: `/${location.slug}`,
  });
}

export default async function LocalSeoPage({ params }: LocalSeoPageProps) {
  const { location: locationSlug } = await params;
  const locale = await getCurrentLocale();
  const location = getLocation(locationSlug as LocationSlug);

  if (!location) {
    notFound();
  }

  const structuredData = buildLocalStructuredData(location);
  const isFilipino = locale === "fil";

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PageShell
        eyebrow={`${getStatusLabel(location.status)} · ${location.region}`}
        title={location.headline}
        description={
          isFilipino
            ? "PuntaGo connects customers with verified local professionals through fair quotations, safe chat, bookings, reviews, and notifications."
            : location.description
        }
      >
        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="panel-shell p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              Starting local, built national
            </p>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Starting in Pangasinan. Built for the Philippines.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              PuntaGo is designed as one platform for every trusted local professional. The
              first operating market is Pangasinan, while the SEO and product structure are ready
              to grow into more Philippine cities and provinces.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/services"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-teal-700 px-5 text-sm font-black !text-white transition hover:bg-teal-800 active:scale-[0.98]"
              >
                Find a Professional
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 transition hover:border-teal-200 hover:bg-teal-50 active:scale-[0.98]"
              >
                Become a Professional
              </Link>
            </div>
          </article>

          <article className="panel-shell p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              Local SEO coverage
            </p>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Services people search for in {location.name}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              PuntaGo supports many professional categories from the admin-managed catalog. These
              examples help search engines understand the wider local service direction without
              changing the existing quote, booking, wallet, chat, or admin systems.
            </p>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {professionalCategoryGroups.map((group) => (
            <article key={group.group} className="soft-card p-5">
              <h2 className="text-lg font-black text-slate-950">{group.group}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const dedicatedPage = localServicePages.find(
                    (page) =>
                      page.location.slug === location.slug &&
                      page.service.categoryLabel === item,
                  );

                  return (
                    <Link
                      key={item}
                      href={
                        dedicatedPage
                          ? getLocalServicePath(dedicatedPage)
                          : `/services?q=${encodeURIComponent(item)}`
                      }
                      className="inline-flex min-h-11 items-center rounded-full border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-black text-teal-800 transition hover:border-teal-200 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
                    >
                      {item}
                    </Link>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[30px] bg-[linear-gradient(135deg,#064e3b,#0f172a)] p-6 text-white sm:p-8">
          <h2 className="text-2xl font-black sm:text-3xl">
            Fair quotations, verified experts, and safe communication.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-teal-50">
            Customers can request quotes and compare professionals. Professionals can receive
            matching requests, submit quotes, use credits, manage bookings, and communicate in one
            trusted platform.
          </p>
        </section>
      </PageShell>
    </>
  );
}
