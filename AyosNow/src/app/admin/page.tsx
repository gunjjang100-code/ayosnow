import Link from "next/link";

import { AdminAccountDeletionPanel } from "@/components/admin/admin-account-deletion-panel";
import { AdminCategoryManager } from "@/components/admin/admin-category-manager";
import { AdminManualCreditPanel } from "@/components/admin/admin-manual-credit-panel";
import { AdminOperatingSettingsPanel } from "@/components/admin/admin-operating-settings-panel";
import { AdminProfessionalBadgePanel } from "@/components/admin/admin-professional-badge-panel";
import { AdminTradesmanApprovalPanel } from "@/components/admin/admin-tradesman-approval-panel";
import { StatCards, type AdminStatCard } from "@/components/admin/StatCards";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { listAccountDeletionAdminItems } from "@/lib/account/account-deletion-service";
import { listAdminCategoryItems } from "@/lib/admin/admin-category-service";
import { getAdminOperatingSettings } from "@/lib/admin/admin-operating-settings-service";
import { listTradesmanApprovalItems } from "@/lib/admin/tradesman-approval-service";
import { getAdminQuoteFeeRevenueStats } from "@/lib/admin/wallet-admin-service";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  getProfessionalBadgeSettingsSnapshot,
  listProfessionalBadgeHistory,
} from "@/lib/professional-badges/professional-badge-service";
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
  const operatingSettings = canUseAdminWorkspace
    ? await getAdminOperatingSettings()
    : null;
  const tradesmanApprovalItems = canUseAdminWorkspace
    ? await listTradesmanApprovalItems()
    : [];
  const professionalBadgeSettings = canUseAdminWorkspace
    ? await getProfessionalBadgeSettingsSnapshot()
    : null;
  const professionalBadgeHistory = canUseAdminWorkspace
    ? await listProfessionalBadgeHistory()
    : [];
  const accountDeletionItems = canUseAdminWorkspace
    ? await listAccountDeletionAdminItems()
    : [];
  const unverifiedTradesmanCount = tradesmanApprovalItems.filter(
    (item) => !item.isVerified,
  ).length;
  const pendingDeletionCount = accountDeletionItems.filter(
    (item) => item.status === "PENDING",
  ).length;
  const adminWalletStats: AdminStatCard[] = [
    {
      label: "Quote Fees",
      value: revenueStats.feeCount,
      helper: "Revenue records created from professional quote submissions.",
      tone: "orange",
    },
    {
      label: "Admin Revenue",
      value: revenueStats.totalRevenue,
      helper: "Total revenue recorded from quote fee deductions.",
      tone: "blue",
      format: "money",
    },
    {
      label: "Expert Wallets",
      value: revenueStats.walletCount,
      helper: "Number of professional accounts with credit wallets.",
      tone: "green",
    },
    {
      label: "Approvals",
      value: unverifiedTradesmanCount,
      helper: "Professional profiles still waiting for verification.",
      tone: "red",
    },
    {
      label: "Deletion Requests",
      value: pendingDeletionCount,
      helper: "Account deletion requests waiting for admin review.",
      tone: "orange",
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

      {operatingSettings ? (
        <AdminOperatingSettingsPanel
          initialReferral={operatingSettings.referral}
          banners={operatingSettings.banners}
          emergency={operatingSettings.emergency}
          ranking={operatingSettings.ranking}
        />
      ) : null}

      {professionalBadgeSettings ? (
        <AdminProfessionalBadgePanel
          initialSettings={professionalBadgeSettings}
          profiles={tradesmanApprovalItems.map((item) => ({
            profileId: item.profileId,
            fullName: item.fullName,
          }))}
          history={professionalBadgeHistory.map((item) => ({
            id: item.id,
            professionalName: item.profile.user.fullName,
            email: item.profile.user.email,
            code: item.code,
            action: item.action,
            reason: item.reason,
            createdAt: item.createdAt.toLocaleString(locale === "fil" ? "fil-PH" : "en-US"),
          }))}
        />
      ) : null}

      <AdminTradesmanApprovalPanel items={tradesmanApprovalItems} />

      <AdminAccountDeletionPanel
        items={accountDeletionItems.map((item) => ({
          ...item,
          requestedAt: item.requestedAt.toLocaleString(locale === "fil" ? "fil-PH" : "en-US"),
          reviewedAt: item.reviewedAt
            ? item.reviewedAt.toLocaleString(locale === "fil" ? "fil-PH" : "en-US")
            : null,
        }))}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/admin/wallets"
          className="rounded-3xl border border-teal-100 bg-white p-5 shadow-[0_22px_55px_-40px_rgba(15,23,42,0.5)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
            Wallet Management
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Open professional credit management
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Review credit add/deduct actions, quote fee deductions, and balances by professional.
          </p>
        </Link>
        <article className="rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_22px_55px_-40px_rgba(15,23,42,0.5)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
            Quote Fee Revenue
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Quote fee revenue history
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The 40 PHP fee deducted on a professional&apos;s first quote is recorded as admin revenue.
          </p>
        </article>
        <Link
          href="/admin/promotional-videos"
          className="rounded-3xl border border-amber-100 bg-white p-5 shadow-[0_22px_55px_-40px_rgba(15,23,42,0.5)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Promotional Videos
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Manage YouTube video links
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Replace or remove the three public video links without redeploying PuntaGo.
          </p>
        </Link>
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
            createdAtLabel: payment.createdAt.toLocaleString(locale === "fil" ? "fil-PH" : "en-US"),
          })),
        }))}
      />

      <section className="panel-shell p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Quote fee revenue history</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review who submitted a quote, which request it belonged to, and when the 40 PHP fee was deducted.
            </p>
          </div>
          <span className="chip">Admin revenue</span>
        </div>
        <div className="mt-5 grid gap-3">
          {revenueStats.recentRows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No quote fee revenue records yet.
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
              <h2 className="text-xl font-bold text-slate-950">Quote fee revenue</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                When a professional submits the first quote for a customer request, 40 PHP is deducted and recorded as admin revenue.
                Quote edits do not add another fee.
              </p>
            </div>
            <span className="chip">40 PHP</span>
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">Duplicate charge protection</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Editing a quote again for the same request does not deduct another fee.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-950">Revenue history</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Quote fees show the professional, request, amount, and time together.
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
