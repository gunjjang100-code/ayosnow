import Link from "next/link";

import { AdminCategoryManager } from "@/components/admin/admin-category-manager";
import { AdminManualCreditPanel } from "@/components/admin/admin-manual-credit-panel";
import { StatCards, type AdminStatCard } from "@/components/admin/StatCards";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { listAdminCategoryItems } from "@/lib/admin/admin-category-service";
import { getAdminQuoteFeeRevenueStats } from "@/lib/admin/wallet-admin-service";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { canAccessAdminWorkspace, getRoleAccessNoticeCopy } from "@/lib/role-ui";
import {
  listWalletTopupAdminItems,
  type WalletTopupAdminItem,
} from "@/lib/wallets/wallet-topup-payment-service";
import { formatAdminDate } from "@/lib/utils";

export default async function AdminPage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
  const canUseAdminWorkspace = canAccessAdminWorkspace(sessionUser.role);
  const adminCategories = canUseAdminWorkspace
    ? await listAdminCategoryItems(locale)
    : [];
  const revenueStats = canUseAdminWorkspace
    ? await getAdminQuoteFeeRevenueStats()
    : { totalRevenue: 0, feeCount: 0, recentRows: [], walletCount: 0 };
  const adminWalletStats: AdminStatCard[] = [
    {
      label: "Quote Fees",
      value: revenueStats.feeCount,
      helper: "전문가 견적 제출로 발생한 수익 건수입니다.",
      tone: "orange",
    },
    {
      label: "Admin Revenue",
      value: revenueStats.totalRevenue,
      helper: "견적료 차감으로 플랫폼에 기록된 총 수익입니다.",
      tone: "blue",
      format: "money",
    },
    {
      label: "Expert Wallets",
      value: revenueStats.walletCount,
      helper: "크레딧을 보유한 전문가 계정 수입니다.",
      tone: "green",
    },
    {
      label: "Recent Fees",
      value: revenueStats.recentRows.length,
      helper: "최근 견적료 수익 내역입니다.",
      tone: "red",
    },
  ];
  const walletAdminItems: WalletTopupAdminItem[] = canUseAdminWorkspace
    ? await listWalletTopupAdminItems()
    : [];
  return (
    <PageShell
      eyebrow={text.adminEyebrow}
      title={text.adminTitle}
      description={text.adminDescription}
    >
      {!canUseAdminWorkspace ? (
        <RoleAccessNotice
          {...getRoleAccessNoticeCopy({
            locale,
            currentRole: sessionUser.role,
            targetWorkspace: "admin-workspace",
          })}
        />
      ) : null}

      {canUseAdminWorkspace ? (
      <>
      <section className="panel-shell p-5">
        <p className="text-sm leading-6 text-slate-600">{text.adminEditHint}</p>
      </section>

      <StatCards cards={adminWalletStats} />

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/wallets"
          className="rounded-3xl border border-teal-100 bg-white p-5 shadow-[0_22px_55px_-40px_rgba(15,23,42,0.5)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
            Wallet Management
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            전문가 크레딧 관리로 이동
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            크레딧 추가/차감, 견적료 차감 기록, 전문가별 잔액을 확인합니다.
          </p>
        </Link>
        <article className="rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_22px_55px_-40px_rgba(15,23,42,0.5)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
            Quote Fee Revenue
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            견적료 수익 내역
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            전문가가 견적을 처음 보낼 때 차감된 40 PHP가 관리자 수익으로 기록됩니다.
          </p>
        </article>
      </section>

      <AdminManualCreditPanel
        items={walletAdminItems.map((item) => ({
          userId: item.id,
          fullName: item.fullName,
          balance: (item.wallet?.balance ?? 0).toString(),
          history: item.walletTopupPayments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            createdAtLabel: payment.createdAt.toLocaleString(locale === "ko" ? "ko-KR" : "en-US"),
          })),
        }))}
      />

      <section className="panel-shell p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">견적료 수익 내역</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              누가 어떤 요청에 견적을 제출했고, 40 PHP가 언제 차감되었는지 확인합니다.
            </p>
          </div>
          <span className="chip">관리자 수익</span>
        </div>
        <div className="mt-5 grid gap-3">
          {revenueStats.recentRows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              아직 견적료 수익 기록이 없습니다.
            </p>
          ) : (
            revenueStats.recentRows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{row.expertName}</p>
                    <p className="mt-1 text-sm text-slate-600">{row.quoteRequestTitle}</p>
                  </div>
                  <p className="font-black text-teal-700">+PHP {row.amount}</p>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {formatAdminDate(row.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AdminCategoryManager
          key={locale}
          initialItems={adminCategories}
          locale={locale}
          text={text}
        />

        <article className="panel-shell p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">견적료 수익</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                전문가가 고객 요청에 처음 견적을 제출하면 40 PHP가 차감되고 관리자 수익으로 기록됩니다.
                견적 수정에는 추가 비용이 붙지 않습니다.
              </p>
            </div>
            <span className="chip">40 PHP</span>
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">중복 청구 방지</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                같은 요청에 같은 전문가가 다시 견적을 수정해도 추가 차감되지 않습니다.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">수익 내역</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                발생한 견적료는 전문가, 요청서, 금액, 시간을 함께 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </article>
          </section>
      </>
      ) : null}
    </PageShell>
  );
}
