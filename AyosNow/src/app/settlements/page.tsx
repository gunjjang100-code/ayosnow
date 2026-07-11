import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { TradesmanWalletTopupPanel } from "@/components/settlements/tradesman-wallet-topup-panel";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import { getPaymentPolicyConsentStatus } from "@/lib/legal-consent";
import {
  canAccessTradesmanWorkspace,
  getRoleAccessNoticeCopy,
} from "@/lib/role-ui";
import { formatAdminDate, formatPhp } from "@/lib/utils";
import { listWalletTopupHistoryForUser } from "@/lib/wallets/wallet-topup-payment-service";
import {
  getWalletSnapshotForUser,
  listWalletCreditTransactionsForUser,
} from "@/lib/wallets/wallet-service";

type WalletTopupHistoryItem = Awaited<
  ReturnType<typeof listWalletTopupHistoryForUser>
>[number];

export default async function SettlementsPage() {
  const locale = await getCurrentLocale();
  const sessionUser = await getOptionalSessionUser();
  const canUsePage = canAccessTradesmanWorkspace(sessionUser.role);
  const canUseSelfTopup = sessionUser.role === "tradesman";
  const walletSnapshot = canUseSelfTopup
    ? await getWalletSnapshotForUser(sessionUser.id)
    : null;
  const walletTopupHistory = canUseSelfTopup
    ? await listWalletTopupHistoryForUser(sessionUser.id)
    : [];
  const paymentPolicyConsent = canUseSelfTopup
    ? await getPaymentPolicyConsentStatus({ userId: sessionUser.id })
    : null;
  const creditTransactions = canUseSelfTopup
    ? await listWalletCreditTransactionsForUser(sessionUser.id)
    : [];

  return (
    <PageShell
      eyebrow="Credits"
      title={locale === "fil" ? "Professional credits" : "Professional credits"}
      description={
        locale === "fil"
          ? "Mag-top up ng credits para sa quote submissions at tingnan ang credit history."
          : "Top up credits for quote submissions and review your credit history."
      }
    >
      {!canUsePage ? (
        <RoleAccessNotice
          {...getRoleAccessNoticeCopy({
            locale,
            currentRole: sessionUser.role,
            targetWorkspace: "tradesman-workspace",
          })}
        />
      ) : null}

      {canUsePage ? (
        <>
          {canUseSelfTopup && walletSnapshot ? (
            <div className="mb-4">
              <TradesmanWalletTopupPanel
                initialBalance={walletSnapshot.balance.toString()}
                requiresPaymentPolicyAcceptance={
                  paymentPolicyConsent?.requiresAcceptance ?? true
                }
                paymentPolicyVersion={
                  paymentPolicyConsent?.paymentPolicyVersion
                }
                historyItems={walletTopupHistory.map((item: WalletTopupHistoryItem) => ({
                  id: item.id,
                  amount: item.amount,
                  status: item.status,
                  createdAtLabel: formatAdminDate(item.createdAt.toISOString()),
                }))}
                locale={locale}
              />
            </div>
          ) : null}

          <section className="panel-shell p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {locale === "fil" ? "Credit transaction history" : "Credit transaction history"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {locale === "fil"
                    ? "Tingnan ang top-ups at quote submission deductions mula pinakabago."
                    : "Review top-ups and quote submission deductions from newest to oldest."}
                </p>
              </div>
              <span className="chip">{locale === "fil" ? "40 PHP quote fee" : "40 PHP quote fee"}</span>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
              {locale === "fil"
                ? "Ang 40 PHP credits ay isang beses lang ibinabawas sa unang successful quote para sa bawat request. Walang panibagong bawas sa pag-edit o muling pagpapadala ng parehong quote. Hindi awtomatikong ibinabalik ang credits kapag binawi, tinanggihan, o hindi napili ang quote. Makikita rito ang bawat top-up at deduction."
                : "The 40 PHP credit fee is deducted once for the first successful quote on each request. Editing or resubmitting that same quote does not deduct again. Credits are not automatically returned when a quote is withdrawn, rejected, or not selected. Every top-up and deduction appears here."}
            </div>

            <div className="mt-5 grid gap-3">
              {creditTransactions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {locale === "fil"
                    ? "Wala pang credit transactions."
                    : "No credit transactions yet."}
                </p>
              ) : (
                creditTransactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">{transaction.label}</p>
                        {transaction.quoteRequestTitle ? (
                          <p className="mt-1 text-sm text-slate-600">
                            {locale === "fil" ? "Request" : "Request"}: {transaction.quoteRequestTitle}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-slate-500">
                          {formatAdminDate(transaction.createdAt)}
                        </p>
                      </div>
                      <p
                        className={
                          transaction.amount >= 0
                            ? "font-black text-emerald-700"
                            : "font-black text-rose-700"
                        }
                      >
                        {transaction.amount >= 0 ? "+" : ""}
                        {formatPhp(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : null}
    </PageShell>
  );
}
