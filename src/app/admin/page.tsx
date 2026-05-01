import Link from "next/link";

import { AdminCategoryManager } from "@/components/admin/admin-category-manager";
import { AdminManualCreditPanel } from "@/components/admin/admin-manual-credit-panel";
import { StatCards, type AdminStatCard } from "@/components/admin/StatCards";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import {
  getAdminAlerts,
  getAdminCategories,
  getApprovalQueue,
  getBannerItems,
  getNoticeItems,
  getOneOutCases,
} from "@/lib/constants/mock-data";
import { getAdminQuoteFeeRevenueStats } from "@/lib/admin/wallet-admin-service";
import { getDemoSessionUser } from "@/lib/auth/session";
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
  const sessionUser = await getDemoSessionUser();
  const canUseAdminWorkspace = canAccessAdminWorkspace(sessionUser.role);
  const adminAlerts = getAdminAlerts(locale);
  const adminCategories = getAdminCategories(locale);
  const bannerItems = getBannerItems(locale);
  const noticeItems = getNoticeItems(locale);
  const approvalQueue = getApprovalQueue(locale);
  const oneOutCases = getOneOutCases(locale);
  const revenueStats = canUseAdminWorkspace
    ? await getAdminQuoteFeeRevenueStats()
    : { totalRevenue: 0, feeCount: 0, recentRows: [], walletCount: 0 };
  const adminWalletStats: AdminStatCard[] = [
    {
      label: "Quote Fees",
      value: revenueStats.feeCount,
      helper: "전문가가 최초 견적 제출 시 차감된 40 PHP 기록 수입니다.",
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
      helper: "크레딧 잔액을 관리 중인 전문가 지갑 수입니다.",
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

      <section className="grid gap-4 lg:grid-cols-3">
        {adminAlerts.map((alert) => (
          <article key={alert.id} className="panel-shell p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">{alert.type}</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">{alert.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{alert.description}</p>
            <button className="mt-5 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              {alert.actionLabel}
            </button>
          </article>
        ))}
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
              <h2 className="text-xl font-bold text-slate-950">견적료 정책</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AyosNow MVP의 수익은 전문가가 요청서에 처음 견적을 보낼 때 차감되는 40 PHP입니다.
                같은 요청서에 견적을 수정해도 다시 차감하지 않습니다.
              </p>
            </div>
            <span className="chip">40 PHP</span>
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">중복 차감 방지</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                서버가 전문가 ID와 요청서 ID를 기준으로 이미 견적료가 차감됐는지 확인합니다.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">관리자 수익 기록</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                차감 성공 시 크레딧 거래 내역에 관리자 수익으로 남겨 추적할 수 있습니다.
              </p>
            </div>
          </div>
        </article>
        <article className="panel-shell p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{text.adminBannersPanel}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text.adminBannersDescription}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
                {text.adminSecondaryAction}
              </button>
              <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
                {text.adminPrimaryAction}
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {bannerItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-bold text-slate-950">{item.title}</p>
                  <span className="chip">{item.statusLabel}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <p>{text.adminColumnPlacement}: {item.placement}</p>
                  <p>{text.adminColumnPeriod}: {item.activePeriod}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-shell p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{text.adminNoticesPanel}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text.adminNoticesDescription}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
                {text.adminSecondaryAction}
              </button>
              <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
                {text.adminPrimaryAction}
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {noticeItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-bold text-slate-950">{item.title}</p>
                  <span className="chip">{item.statusLabel}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <p>{text.adminColumnAudience}: {item.audienceLabel}</p>
                  <p>{text.adminColumnPublishedAt}: {item.publishedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-shell p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{text.adminApprovalsPanel}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text.adminApprovalsDescription}</p>
            </div>
            <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              {text.adminApproveAction}
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            {approvalQueue.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="font-bold text-slate-950">{item.tradesmanName}</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <p>{text.adminColumnCategory}: {item.categoryLabel}</p>
                  <p>{text.adminColumnSubmittedAt}: {item.submittedAt}</p>
                  <p>{text.adminColumnVerification}: {item.verificationLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-shell p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{text.adminOneOutPanel}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text.adminOneOutDescription}</p>
            </div>
            <button className="rounded-full bg-rose-600 px-4 py-2 text-sm font-bold text-white">
              {text.adminSuspendAction}
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            {oneOutCases.map((item) => (
              <div key={item.id} className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                <p className="font-bold text-slate-950">{item.tradesmanName}</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <p>{text.adminColumnIssue}: {item.issueSummary}</p>
                  <p>{text.adminColumnRisk}: {item.riskLevel}</p>
                  <p>{text.adminColumnLastAction}: {item.lastActionAt}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
          </section>
      </>
      ) : null}
    </PageShell>
  );
}
