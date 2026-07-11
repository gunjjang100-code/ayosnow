import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { StatCard } from "@/components/shared/stat-card";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { listDashboardStatsForUser } from "@/lib/dashboard/list-dashboard-stats-service";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  canAccessTradesmanWorkspace,
  getRoleAccessNoticeCopy,
} from "@/lib/role-ui";

export default async function DashboardPage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
  const canUseDashboard = canAccessTradesmanWorkspace(sessionUser.role);
  let stats: Awaited<ReturnType<typeof listDashboardStatsForUser>> = [];
  let statsLoadFailed = false;

  try {
    if (canUseDashboard) {
      stats = await listDashboardStatsForUser({
        sessionUserId: sessionUser.id,
        role: sessionUser.role,
        locale,
      });
    }
  } catch {
    statsLoadFailed = true;
  }

  return (
    <PageShell
      eyebrow={text.dashboardEyebrow}
      title={`${sessionUser.name}${text.dashboardTitleSuffix}`}
      description={text.dashboardDescription}
    >
      {!canUseDashboard ? (
        <RoleAccessNotice
          {...getRoleAccessNoticeCopy({
            locale,
            currentRole: sessionUser.role,
            targetWorkspace: "tradesman-workspace",
          })}
        />
      ) : null}

      {canUseDashboard ? (
        <article className="rounded-3xl border border-teal-100 bg-teal-50 px-5 py-4 text-slate-800">
          <p className="text-sm font-bold text-teal-800">
            {statsLoadFailed
              ? locale === "fil"
                ? "Hindi ma-load ang dashboard stats."
                : "Could not load dashboard stats."
              : locale === "fil"
                ? "Aking activity"
                : "My activity"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {statsLoadFailed
              ? locale === "fil"
                ? "Subukan ulit mamaya. Kung tuloy pa rin ang problema, kontakin ang support."
                : "Please try again shortly. If the problem continues, contact support."
              : locale === "fil"
                ? "Ipinapakita rito ang requests, bookings, at alerts ng kasalukuyang account."
                : "This shows requests, bookings, and alerts for the signed-in account."}
          </p>
        </article>
      ) : null}

      {canUseDashboard && sessionUser.role === "tradesman" ? (
        <article className="panel-shell p-5">
          <p className="text-sm font-bold text-teal-700">{text.dashboardNotificationTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {locale === "fil"
              ? "Makikita mo na ngayon ang bagong quote requests, quote submissions, at booking status alerts sa notification button sa itaas."
              : "New quote requests, quote submissions, and booking status alerts now appear in the notification button at the top of the screen."}
          </p>
        </article>
      ) : null}

      {canUseDashboard ? (
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      ) : null}

      {canUseDashboard ? (
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel-shell p-5">
          <p className="text-lg font-bold text-slate-950">{text.dashboardCustomerTitle}</p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
            <li>{text.dashboardCustomer1}</li>
            <li>{text.dashboardCustomer2}</li>
            <li>{text.dashboardCustomer3}</li>
          </ul>
        </article>
        <article className="panel-shell p-5">
          <p className="text-lg font-bold text-slate-950">{text.dashboardTradesmanTitle}</p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
            <li>{text.dashboardTradesman1}</li>
            <li>{text.dashboardTradesman2}</li>
            <li>{text.dashboardTradesman3}</li>
          </ul>
        </article>
      </section>
      ) : null}
    </PageShell>
  );
}
