import Link from "next/link";

import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { SelectQuoteButton } from "@/components/chat/select-quote-button";
import { PageShell } from "@/components/shared/page-shell";
import { getDemoSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listQuoteWorkspaceForCustomer } from "@/lib/quotes/service";
import {
  canAccessCustomerMarketplace,
  getRoleAccessNoticeCopy,
} from "@/lib/role-ui";

function getIntlLocale(locale: Awaited<ReturnType<typeof getCurrentLocale>>) {
  if (locale === "ko") {
    return "ko-KR";
  }

  if (locale === "fil") {
    return "fil-PH";
  }

  return "en-US";
}

function hasExplicitYear(rawValue: string) {
  return /\b\d{4}\b/.test(rawValue);
}

function formatQuoteDateLabel(
  locale: Awaited<ReturnType<typeof getCurrentLocale>>,
  rawValue: string,
  fallbackYearSource?: string,
) {
  // 날짜 문자열은 두 종류가 섞여 있다.
  // 1) 실제 DB/목업의 ISO 형식: 2026-04-15
  // 2) 이미 사람이 읽기 좋은 문장형 형식: "4월 15일 오전 9시"
  // 영어/필리핀어 목업의 "Apr 15, 9:00 AM" 같은 값은 연도가 빠져 있어서
  // JS가 2001년으로 잘못 해석할 수 있다.
  // 그래서 연도가 없는 경우에는 요청 날짜의 연도를 붙여서 다시 읽는다.
  const fallbackYear = fallbackYearSource
    ? new Date(fallbackYearSource).getFullYear()
    : null;

  const normalizedValue =
    locale !== "ko" && !hasExplicitYear(rawValue) && fallbackYear
      ? `${rawValue}, ${fallbackYear}`
      : rawValue;

  // 그래도 파싱이 안 되면 억지로 바꾸지 않고 원문을 그대로 보여 준다.
  const parsed = new Date(normalizedValue);

  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }

  return parsed.toLocaleString(getIntlLocale(locale));
}

export default async function QuotesPage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getDemoSessionUser();
  const canUseCustomerQuotes = canAccessCustomerMarketplace(sessionUser.role);

  const quoteWorkspaces =
    canUseCustomerQuotes
      ? await listQuoteWorkspaceForCustomer(sessionUser.id).catch(() => [])
      : [];

  const activeWorkspace = quoteWorkspaces[0];

  return (
    <PageShell
      eyebrow={text.quotesEyebrow}
      title={text.quotesTitle}
      description={text.quotesDescription}
    >
      {!canUseCustomerQuotes ? (
        <RoleAccessNotice
          {...getRoleAccessNoticeCopy({
            locale,
            currentRole: sessionUser.role,
            targetWorkspace: "customer-marketplace",
          })}
        />
      ) : null}

      {canUseCustomerQuotes && !activeWorkspace ? (
        <section className="soft-card p-6 text-sm leading-7 text-slate-600">
          <p className="text-base font-bold text-slate-950">{text.quotesEmptyTitle}</p>
          <p className="mt-2">{text.quotesEmptyDescription}</p>
        </section>
      ) : null}

      {canUseCustomerQuotes && activeWorkspace ? (
        <section className="soft-card p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">{text.quotesActiveRequest}</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                {activeWorkspace.request.serviceName}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {activeWorkspace.request.location} · {activeWorkspace.request.budgetLabel} ·{" "}
                {formatQuoteDateLabel(locale, activeWorkspace.request.targetDate)}
              </p>
            </div>
            <span className="chip">
              {text.quotesReceivedCount} {activeWorkspace.offers.length}
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            {activeWorkspace.offers.map((offer) => (
              <article key={offer.id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xl font-bold text-slate-950">{offer.tradesmanName}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {text.quotesRatingLabel} {offer.rating} / {text.quotesCompletedJobsLabel}{" "}
                      {offer.completedJobs}
                      {text.quotesCompletedJobsSuffix}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-slate-700">{offer.message}</p>
                  </div>
                  <div className="min-w-52 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-500">{text.quotesOfferAmount}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{offer.amountLabel}</p>
                    <p className="mt-2">
                      {formatQuoteDateLabel(
                        locale,
                        offer.arrivalText,
                        activeWorkspace.request.targetDate,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Link href={`/tradesmen/${offer.tradesmanSlug}`} className="text-sm font-bold text-teal-700">
                    {text.quotesProfileLink}
                  </Link>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-right text-xs leading-5 text-slate-500">
                      {text.quotesChatAfterBookingHint}
                    </p>
                    <SelectQuoteButton
                      quoteId={offer.id}
                      label={text.quotesSelectButton}
                      pendingLabel={text.quotesSelectPending}
                      successLabel={text.quotesSelectSuccess}
                      errorLabel={text.quotesSelectError}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
