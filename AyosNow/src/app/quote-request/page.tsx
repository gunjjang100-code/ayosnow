import { QuoteRequestForm } from "@/components/quote-request/quote-request-form";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { PageShell } from "@/components/shared/page-shell";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listMarketplaceCategories } from "@/lib/marketplace/catalog-service";
import { canAccessCustomerMarketplace, getRoleAccessNoticeCopy } from "@/lib/role-ui";
import { createPageMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata = createPageMetadata({
  title: "Request Fair Quotations",
  description:
    "Submit one PuntaGo quote request and compare verified local professionals for everyday services in Pangasinan and future Philippine cities.",
  path: "/quote-request",
});

export default async function QuoteRequestPage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
  const categories = await listMarketplaceCategories(locale);

  return (
    <PageShell
      eyebrow={text.quoteRequestEyebrow}
      title={text.quoteRequestTitle}
      description={text.quoteRequestDescription}
    >
      {canAccessCustomerMarketplace(sessionUser.role) ? (
        !sessionUser.token ? (
          <article className="panel-shell p-6">
            <p className="text-xl font-bold text-slate-950">{text.quoteRequestLoginTitle}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {text.quoteRequestLoginDescription}
            </p>
            <Link
              href="/login?callbackUrl=/quote-request"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold !text-white shadow-[0_16px_28px_-20px_rgba(15,23,42,0.8)] transition hover:bg-teal-800 hover:!text-white active:scale-[0.98] active:bg-teal-950 focus-visible:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            >
              {text.quoteRequestLoginButton}
            </Link>
          </article>
        ) : categories.length === 0 ? (
          <article className="panel-shell p-6">
            <p className="text-xl font-bold text-slate-950">{text.quoteRequestNoCategoryTitle}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {text.quoteRequestNoCategoryDescription}
            </p>
          </article>
        ) : (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold leading-6 text-teal-950">
            {locale === "fil"
              ? "Libre ang paggawa ng service request at pagtanggap o pagkumpara ng quotations. Walang PuntaGo credits na kailangan ng customer."
              : "Creating a service request and receiving or comparing quotations are free for customers. No PuntaGo credits are required."}
          </div>
          <section className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
            <QuoteRequestForm locale={locale} initialCategories={categories} />

            <div className="grid gap-4 lg:sticky lg:top-32 lg:self-start">
              <article className="soft-card p-4 md:p-5">
                <p className="text-sm font-bold text-teal-700">{text.quoteRequestFlowTitle}</p>
                <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                  {[text.quoteRequestFlow1, text.quoteRequestFlow2, text.quoteRequestFlow3, text.quoteRequestFlow4].map((item, index) => (
                    <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </article>
              <article className="soft-card p-4 md:p-5">
                <p className="text-sm font-bold text-amber-700">{text.quoteRequestValidationTitle}</p>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                  <li>{text.quoteRequestValidation1}</li>
                  <li>{text.quoteRequestValidation2}</li>
                  <li>{text.quoteRequestValidation3}</li>
                </ul>
              </article>
            </div>
          </section>
        </div>
        )
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
