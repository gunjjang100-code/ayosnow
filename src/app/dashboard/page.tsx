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
            {statsLoadFailed ? "대시보드 수치를 불러오지 못했습니다." : "내 활동 현황"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {statsLoadFailed
              ? "잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터에 문의해 주세요."
              : "현재 로그인한 계정의 요청, 예약, 알림 현황을 보여줍니다."}
          </p>
        </article>
      ) : null}

      {canUseDashboard && sessionUser.role === "tradesman" ? (
        <article className="panel-shell p-5">
          <p className="text-sm font-bold text-teal-700">{text.dashboardNotificationTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            이제 새 견적 요청, 견적 제출, 예약 상태 변경 알림은 화면 상단의 알림 버튼에서
            바로 확인합니다. 대시보드가 아닌 다른 화면에 있어도 같은 곳에서 이어서 볼 수
            있게 한곳으로 모았습니다.
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
