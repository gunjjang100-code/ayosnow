import { QuoteRequestForm } from "@/components/quote-request/quote-request-form";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { PageShell } from "@/components/shared/page-shell";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listMarketplaceCategories } from "@/lib/marketplace/catalog-service";
import { canAccessCustomerMarketplace, getRoleAccessNoticeCopy } from "@/lib/role-ui";
import Link from "next/link";

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
            <p className="text-xl font-bold text-slate-950">견적 요청은 로그인 후 등록할 수 있습니다.</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              로그인하면 요청 내용을 저장하고 전문가에게 견적을 받을 수 있습니다.
            </p>
            <Link
              href="/login?callbackUrl=/quote-request"
              className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-bold !text-white shadow-[0_16px_28px_-20px_rgba(15,23,42,0.8)] transition hover:bg-slate-800 hover:!text-white focus-visible:!text-white"
            >
              로그인하고 견적 요청하기
            </Link>
          </article>
        ) : categories.length === 0 ? (
          <article className="panel-shell p-6">
            <p className="text-xl font-bold text-slate-950">견적 요청 가능한 카테고리가 아직 없습니다.</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              요청 가능한 서비스가 준비되는 대로 이곳에서 선택할 수 있습니다.
            </p>
          </article>
        ) : (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <QuoteRequestForm locale={locale} initialCategories={categories} />

          <div className="grid gap-4">
            <article className="soft-card p-5">
              <p className="text-sm font-bold text-teal-700">{text.quoteRequestFlowTitle}</p>
              <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                <li>{text.quoteRequestFlow1}</li>
                <li>{text.quoteRequestFlow2}</li>
                <li>{text.quoteRequestFlow3}</li>
                <li>{text.quoteRequestFlow4}</li>
              </ol>
            </article>
            <article className="soft-card p-5">
              <p className="text-sm font-bold text-amber-700">{text.quoteRequestValidationTitle}</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                <li>{text.quoteRequestValidation1}</li>
                <li>{text.quoteRequestValidation2}</li>
                <li>{text.quoteRequestValidation3}</li>
              </ul>
            </article>
          </div>
        </section>
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
