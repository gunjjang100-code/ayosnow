import { NotificationRelatedType } from "@prisma/client";
import { notFound } from "next/navigation";

import { TradesmanQuoteForm } from "@/components/quote-request/tradesman-quote-form";
import { PageShell } from "@/components/shared/page-shell";
import { getDemoSessionUser, isAdmin } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { getWalletSnapshotForUser, QUOTE_SUBMISSION_CREDIT_COST } from "@/lib/wallets/wallet-service";

export default async function QuoteRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getDemoSessionUser();
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

  const hasNotification =
    sessionUser.role === "tradesman"
      ? await prisma.notification.findFirst({
          where: {
            userId: sessionUser.id,
            relatedId: quoteRequest.id,
            relatedType: NotificationRelatedType.QUOTE_REQUEST,
          },
        })
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

  const canSubmitQuote = sessionUser.role === "tradesman";
  const isQuoteLocked = quoteRequest.status !== "OPEN";
  const quoteLockedMessage = isQuoteLocked
    ? "이 요청은 이미 닫혔거나 다른 견적이 선택되어 지금은 새 견적을 보낼 수 없습니다."
    : `고객이 이 요청을 검토 중입니다. 처음 견적을 보내면 ${QUOTE_SUBMISSION_CREDIT_COST} PHP가 차감되고, 이후 수정은 추가 차감되지 않습니다.`;

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

        {canSubmitQuote ? (
          <TradesmanQuoteForm
            quoteRequestId={quoteRequest.id}
            defaultAmount={existingQuote?.amount.toString()}
            defaultVisitDate={existingQuote?.visitDate?.toISOString()}
            defaultMessage={existingQuote?.message}
            currentBalance={walletSnapshot?.balance.toString() ?? "0"}
            isEditingExistingQuote={Boolean(existingQuote)}
            isLocked={isQuoteLocked}
            lockedMessage={quoteLockedMessage}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
