import { NotificationRelatedType } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SelectQuoteButton } from "@/components/chat/select-quote-button";
import { QuoteRequestOwnerActions } from "@/components/quote-request/quote-request-owner-actions";
import { TradesmanQuoteForm } from "@/components/quote-request/tradesman-quote-form";
import { PageShell } from "@/components/shared/page-shell";
import { ProfessionalBadges } from "@/components/shared/professional-badges";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listMarketplaceCategories } from "@/lib/marketplace/catalog-service";
import { prisma } from "@/lib/prisma";
import { listQuoteWorkspaceForCustomer } from "@/lib/quotes/service";
import { getTradesmanVerificationState } from "@/lib/tradesmen/verification-service";
import { getWalletSnapshotForUser, QUOTE_SUBMISSION_CREDIT_COST } from "@/lib/wallets/wallet-service";

function getIntlLocale(locale: Awaited<ReturnType<typeof getCurrentLocale>>) {
  return locale === "fil" ? "fil-PH" : "en-PH";
}

function hasExplicitYear(rawValue: string) {
  return /\b\d{4}\b/.test(rawValue);
}

function formatQuoteDateLabel(
  locale: Awaited<ReturnType<typeof getCurrentLocale>>,
  rawValue: string,
  fallbackYearSource?: string,
) {
  const fallbackYear = fallbackYearSource
    ? new Date(fallbackYearSource).getFullYear()
    : null;
  const normalizedValue =
    !hasExplicitYear(rawValue) && fallbackYear
      ? `${rawValue}, ${fallbackYear}`
      : rawValue;
  const parsed = new Date(normalizedValue);

  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }

  return parsed.toLocaleString(getIntlLocale(locale));
}

export default async function QuoteRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getSessionUser();
  const quoteRequest = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      customer: true,
      category: true,
    },
  });

  if (!quoteRequest) {
    notFound();
  }

  if (!sessionUser) {
    redirect(`/login?callbackUrl=/quote-requests/${quoteRequest.id}`);
  }

  const hasNotification =
    sessionUser.role === "tradesman"
      ? await getTradesmanVerificationState(sessionUser.id).then((verification) =>
          verification.isVerified
            ? prisma.notification.findFirst({
                where: {
                  userId: sessionUser.id,
                  relatedId: quoteRequest.id,
                  relatedType: NotificationRelatedType.QUOTE_REQUEST,
                },
              })
            : null,
        )
      : null;
  const tradesmanVerification =
    sessionUser.role === "tradesman"
      ? await getTradesmanVerificationState(sessionUser.id)
      : null;

  const canView =
    quoteRequest.customerId === sessionUser.id ||
    Boolean(hasNotification) ||
    isAdmin(sessionUser.role);

  if (!canView) {
    notFound();
  }

  const existingQuote =
    sessionUser.role === "tradesman"
      ? await prisma.quote.findUnique({
          where: {
            quoteRequestId_tradesmanId: {
              quoteRequestId: quoteRequest.id,
              tradesmanId: sessionUser.id,
            },
          },
        })
      : null;
  const walletSnapshot =
    sessionUser.role === "tradesman"
      ? await getWalletSnapshotForUser(sessionUser.id)
      : null;
  const categories =
    quoteRequest.customerId === sessionUser.id
      ? await listMarketplaceCategories(locale)
      : [];

  const canSubmitQuote = sessionUser.role === "tradesman" && Boolean(tradesmanVerification?.isVerified);
  const isOwner = quoteRequest.customerId === sessionUser.id;
  const canOwnerEdit = isOwner && quoteRequest.status === "OPEN";
  const ownerQuoteWorkspace = isOwner
    ? await listQuoteWorkspaceForCustomer(sessionUser.id)
        .then((workspaces) =>
          workspaces.find((workspace) => workspace.request.id === quoteRequest.id) ?? null,
        )
        .catch(() => null)
    : null;
  const isQuoteLocked = quoteRequest.status !== "OPEN";
  const quoteLockedMessage = isQuoteLocked
    ? quoteRequest.status === "CANCELLED"
      ? locale === "fil"
        ? "Kinansela na ng customer ang request na ito. Naka-lock na ang quote form at hindi na puwedeng magpadala ng bagong quote."
        : "The customer cancelled this request. The quote form is locked and new quotes cannot be sent."
      : locale === "fil"
        ? "Sarado na ang request na ito o may napili nang ibang quote, kaya hindi na puwedeng magpadala ng bagong quote."
        : "This request is already closed or another quote was selected, so a new quote cannot be sent now."
    : locale === "fil"
      ? `Nire-review ng customer ang request na ito. Kapag unang nagpadala ka ng quote, ${QUOTE_SUBMISSION_CREDIT_COST} PHP ang mababawas. Walang dagdag na bawas para sa edits.`
      : `The customer is reviewing this request. Sending the first quote deducts ${QUOTE_SUBMISSION_CREDIT_COST} PHP, and later edits do not deduct again.`;
  const ownerActionDefaultValues = {
    categorySlug: quoteRequest.category.slug,
    title: quoteRequest.title,
    description: quoteRequest.description,
    city: quoteRequest.city,
    addressLine: quoteRequest.addressLine,
    budgetMin: quoteRequest.budgetMin?.toString() ?? "",
    budgetMax: quoteRequest.budgetMax?.toString() ?? "",
    targetDate: quoteRequest.targetDate?.toISOString().slice(0, 10) ?? "",
  };

  return (
    <PageShell
      eyebrow={text.quoteRequestEyebrow}
      title={quoteRequest.title}
      description={text.quoteRequestDescription}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="soft-card p-5">
          <dl className="grid gap-4 text-sm text-slate-700">
            <div>
              <dt className="font-bold text-slate-950">Category</dt>
              <dd className="mt-1">{quoteRequest.category.name}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-950">Customer</dt>
              <dd className="mt-1">{quoteRequest.customer.fullName}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-950">Location</dt>
              <dd className="mt-1">
                {quoteRequest.city} / {quoteRequest.addressLine}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-950">Status</dt>
              <dd className="mt-1">{quoteRequest.status}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-950">Target date</dt>
              <dd className="mt-1">
                {quoteRequest.targetDate
                  ? quoteRequest.targetDate.toLocaleDateString()
                  : "-"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="soft-card p-5">
          <p className="text-sm font-bold text-slate-950">Description</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {quoteRequest.description}
          </p>
          <div className="mt-5 grid gap-2 text-sm text-slate-700">
            <p>
              Budget min:{" "}
              {quoteRequest.budgetMin ? `PHP ${quoteRequest.budgetMin.toString()}` : "-"}
            </p>
            <p>
              Budget max:{" "}
              {quoteRequest.budgetMax ? `PHP ${quoteRequest.budgetMax.toString()}` : "-"}
            </p>
          </div>
        </article>

        {isOwner ? (
          <article className="soft-card p-5 lg:col-span-3">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-teal-700">{text.quotesReceivedCount}</p>
                <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                  {locale === "fil" ? "Mga quote para sa request na ito" : "Quotes for this request"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {locale === "fil"
                    ? "Ihambing ang presyo, oras ng pagbisita, mensahe, rating, at completed jobs bago pumili."
                    : "Compare price, visit time, message, rating, and completed jobs before choosing."}
                </p>
              </div>
              <span className="chip">
                {text.quotesReceivedCount} {ownerQuoteWorkspace?.offers.length ?? 0}
              </span>
            </div>

            {!ownerQuoteWorkspace || ownerQuoteWorkspace.offers.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {locale === "fil"
                  ? "Wala pang quote para sa request na ito. Lalabas dito ang presyo at visit time kapag nagpadala na ang professional."
                  : "No quotes have been sent for this request yet. Price and visit time will appear here once a professional sends an offer."}
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {ownerQuoteWorkspace.offers.map((offer) => (
                  <article
                    key={offer.id}
                    className="rounded-[22px] border border-slate-200 bg-white p-4 md:p-5"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                      <div>
                        <p className="text-xl font-black text-slate-950">
                          {offer.tradesmanName}
                        </p>
                        <div className="mt-2">
                          <ProfessionalBadges badges={offer.tradesmanBadges} compact />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {text.quotesRatingLabel} {offer.rating} /{" "}
                          {text.quotesCompletedJobsLabel} {offer.completedJobs}
                          {text.quotesCompletedJobsSuffix}
                        </p>
                        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                          {offer.message}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-semibold text-slate-500">{text.quotesOfferAmount}</p>
                        <p className="mt-2 text-[1.8rem] font-black leading-tight text-slate-950">
                          {offer.amountLabel}
                        </p>
                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                          {locale === "fil" ? "Visit time" : "Visit time"}
                        </p>
                        <p className="mt-2 font-bold text-slate-900">
                          {formatQuoteDateLabel(
                            locale,
                            offer.arrivalText,
                            ownerQuoteWorkspace.request.targetDate,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <Link
                        href={`/tradesmen/${offer.tradesmanSlug}`}
                        className="mobile-secondary-button w-full md:w-auto"
                      >
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
            )}
          </article>
        ) : null}

        {canSubmitQuote ? (
          <TradesmanQuoteForm
            quoteRequestId={quoteRequest.id}
            existingQuoteId={existingQuote?.status === "PENDING" ? existingQuote.id : undefined}
            defaultAmount={existingQuote?.amount.toString()}
            defaultVisitDate={existingQuote?.visitDate?.toISOString()}
            defaultMessage={existingQuote?.message}
            currentBalance={walletSnapshot?.balance.toString() ?? "0"}
            isEditingExistingQuote={Boolean(existingQuote)}
            isLocked={isQuoteLocked}
            lockedMessage={quoteLockedMessage}
            locale={locale}
          />
        ) : null}

        {isOwner ? (
          <QuoteRequestOwnerActions
            quoteRequestId={quoteRequest.id}
            locale={locale}
            categories={categories}
            defaultValues={ownerActionDefaultValues}
            status={quoteRequest.status}
            canEdit={canOwnerEdit}
            text={{
              title: text.quoteRequestOwnerActionsTitle,
              description: text.quoteRequestOwnerActionsDescription,
              saveAction: text.quoteRequestOwnerSaveAction,
              savePending: text.quoteRequestOwnerSavePending,
              saveSuccess: text.quoteRequestOwnerSaveSuccess,
              saveError: text.quoteRequestOwnerSaveError,
              cancelAction: text.quoteRequestOwnerCancelAction,
              cancelPending: text.quoteRequestOwnerCancelPending,
              cancelSuccess: text.quoteRequestOwnerCancelSuccess,
              cancelError: text.quoteRequestOwnerCancelError,
              cancelConfirm: text.quoteRequestOwnerCancelConfirm,
              cancelConfirmAction: text.quoteRequestOwnerCancelConfirmAction,
              cancelKeepAction: text.quoteRequestOwnerCancelKeepAction,
              cancelledNotice: text.quoteRequestOwnerCancelledNotice,
              closedNotice: text.quoteRequestOwnerClosedNotice,
              dangerTitle: text.quoteRequestOwnerDangerTitle,
              dangerDescription: text.quoteRequestOwnerDangerDescription,
              serviceTypeLabel: text.quoteRequestServiceType,
              titleLabel: text.quoteRequestTitleLabel,
              descriptionLabel: text.quoteRequestDescriptionLabel,
              locationLabel: text.quoteRequestLocationLabel,
              addressLabel: text.quoteRequestAddressLabel,
              dateLabel: text.quoteRequestDateLabel,
              minBudgetLabel: text.quoteRequestMinBudgetLabel,
              maxBudgetLabel: text.quoteRequestMaxBudgetLabel,
            }}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
