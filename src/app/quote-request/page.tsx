import { QuoteRequestForm } from "@/components/quote-request/quote-request-form";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { PageShell } from "@/components/shared/page-shell";
import { getDemoSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listMarketplaceCategories } from "@/lib/marketplace/catalog-service";
import { canAccessCustomerMarketplace, getRoleAccessNoticeCopy } from "@/lib/role-ui";
import Link from "next/link";

export default async function QuoteRequestPage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getDemoSessionUser();
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
              홈과 서비스 목록은 둘러볼 수 있지만, 실제 요청 저장은 고객 계정 확인 후에만 가능합니다.
            </p>
            <Link
              href="/login?callbackUrl=/quote-request"
              className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              로그인하고 견적 요청하기
            </Link>
          </article>
        ) : categories.length === 0 ? (
          <article className="panel-shell p-6">
            <p className="text-xl font-bold text-slate-950">견적 요청 가능한 카테고리가 아직 없습니다.</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              관리자에서 카테고리를 먼저 등록해야 고객이 요청서를 보낼 수 있습니다.
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
