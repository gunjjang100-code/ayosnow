import Link from "next/link";

import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { SelectQuoteButton } from "@/components/chat/select-quote-button";
import { PageShell } from "@/components/shared/page-shell";
import { ProfessionalBadges } from "@/components/shared/professional-badges";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listQuoteWorkspaceForCustomer } from "@/lib/quotes/service";
import {
  canAccessCustomerMarketplace,
  getRoleAccessNoticeCopy,
} from "@/lib/role-ui";

function getIntlLocale(locale: Awaited<ReturnType<typeof getCurrentLocale>>) {
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
  // Some stored date labels are plain text without a year.
  // Add the request year when needed so JavaScript does not parse them as an old default year.
  const fallbackYear = fallbackYearSource
    ? new Date(fallbackYearSource).getFullYear()
    : null;

  const normalizedValue =
    !hasExplicitYear(rawValue) && fallbackYear
      ? `${rawValue}, ${fallbackYear}`
      : rawValue;

  // If parsing still fails, keep the original value instead of guessing.
  const parsed = new Date(normalizedValue);

  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }

  return parsed.toLocaleString(getIntlLocale(locale));
}

export default async function QuotesPage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
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
        <section className="soft-card p-4 md:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">{text.quotesActiveRequest}</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                {activeWorkspace.request.serviceName}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="chip border-slate-200 bg-slate-50 text-slate-700">{activeWorkspace.request.location}</span>
                <span className="chip">{activeWorkspace.request.budgetLabel}</span>
                <span className="chip border-slate-200 bg-slate-50 text-slate-700">
                  {formatQuoteDateLabel(locale, activeWorkspace.request.targetDate)}
                </span>
              </div>
            </div>
            <span className="chip">
              {text.quotesReceivedCount} {activeWorkspace.offers.length}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {activeWorkspace.offers.map((offer) => (
              <article key={offer.id} className="rounded-[22px] border border-slate-200 bg-white p-4 md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xl font-black text-slate-950">{offer.tradesmanName}</p>
                    <div className="mt-2">
                      <ProfessionalBadges badges={offer.tradesmanBadges} compact />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {text.quotesRatingLabel} {offer.rating} / {text.quotesCompletedJobsLabel}{" "}
                      {offer.completedJobs}
                      {text.quotesCompletedJobsSuffix}
                    </p>
                    <p className="mt-4 text-[15px] leading-7 text-slate-700">{offer.message}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 md:min-w-52">
                    <p className="font-semibold text-slate-500">{text.quotesOfferAmount}</p>
                    <p className="mt-2 text-[1.8rem] font-black leading-tight text-slate-950">{offer.amountLabel}</p>
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
                  <Link href={`/tradesmen/${offer.tradesmanSlug}`} className="mobile-secondary-button w-full md:w-auto">
                    {text.quotesProfileLink}
                  </Link>
                  <div className="flex flex-col gap-2 md:items-end">
                    <p className="text-left text-xs leading-5 text-slate-500 md:text-right">
                      {text.quotesChatAfterBookingHint}
                    </p>
                    {offer.status === "PENDING" ? (
                      <SelectQuoteButton
                        quoteId={offer.id}
                        label={text.quotesSelectButton}
                        pendingLabel={text.quotesSelectPending}
                        successLabel={text.quotesSelectSuccess}
                        errorLabel={text.quotesSelectError}
                        rejectLabel={text.quotesRejectButton}
                        rejectPendingLabel={text.quotesRejectPending}
                        rejectSuccessLabel={text.quotesRejectSuccess}
                        rejectErrorLabel={text.quotesRejectError}
                        rejectConfirmLabel={text.quotesRejectConfirm}
                        selectConfirmLabel={text.quotesSelectConfirm}
                      />
                    ) : (
                      <p className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600">
                        {offer.status === "REJECTED" ? text.quotesRejectedStatus : offer.status}
                      </p>
                    )}
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
