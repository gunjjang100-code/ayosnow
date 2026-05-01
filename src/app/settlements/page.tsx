import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { TradesmanWalletTopupPanel } from "@/components/settlements/tradesman-wallet-topup-panel";
import { getDemoSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
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
  const sessionUser = await getDemoSessionUser();
  const canUsePage = canAccessTradesmanWorkspace(sessionUser.role);
  const canUseSelfTopup = sessionUser.role === "tradesman";
  const walletSnapshot = canUseSelfTopup
    ? await getWalletSnapshotForUser(sessionUser.id)
    : null;
  const walletTopupHistory = canUseSelfTopup
    ? await listWalletTopupHistoryForUser(sessionUser.id)
    : [];
  const creditTransactions = canUseSelfTopup
    ? await listWalletCreditTransactionsForUser(sessionUser.id)
    : [];

  return (
    <PageShell
      eyebrow="Credits"
      title="전문가 크레딧과 견적료 차감 내역"
      description="AyosNow MVP에서는 고객은 웹 안에서 비용 처리를 하지 않고, 전문가는 견적을 처음 제출할 때 40 PHP만 차감됩니다."
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
                historyItems={walletTopupHistory.map((item: WalletTopupHistoryItem) => ({
                  id: item.id,
                  amount: item.amount,
                  status: item.status,
                  createdAtLabel: formatAdminDate(item.createdAt.toISOString()),
                }))}
              />
            </div>
          ) : null}

          <section className="panel-shell p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">크레딧 거래 내역</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  충전은 플러스, 견적료 40 PHP 차감은 마이너스로 표시됩니다. 같은 요청의 견적 수정은 추가 차감되지 않습니다.
                </p>
              </div>
              <span className="chip">견적료 40 PHP</span>
            </div>

            <div className="mt-5 grid gap-3">
              {creditTransactions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  아직 크레딧 거래 내역이 없습니다.
                </p>
              ) : (
                creditTransactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">{transaction.label}</p>
                        {transaction.quoteRequestTitle ? (
                          <p className="mt-1 text-sm text-slate-600">
                            요청: {transaction.quoteRequestTitle}
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
