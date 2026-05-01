import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { getDemoSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listReceivedQuoteRequestsForWorkspace } from "@/lib/quote-requests/list-received-requests-service";
import {
  canAccessTradesmanWorkspace,
  getRoleAccessNoticeCopy,
} from "@/lib/role-ui";

export default async function RequestsPage() {
  const locale = await getCurrentLocale();
  const sessionUser = await getDemoSessionUser();
  const canUsePage = canAccessTradesmanWorkspace(sessionUser.role);
  const requestsResult = canUsePage
    ? await listReceivedQuoteRequestsForWorkspace({
        userId: sessionUser.id,
        role: sessionUser.role === "tradesman" ? "TRADESMAN" : "ADMIN",
        locale,
      })
    : null;
  const requests = requestsResult?.source === "database" ? requestsResult.items : [];

  return (
    <PageShell
      eyebrow={
        locale === "en" ? "Incoming requests" : locale === "fil" ? "Incoming requests" : "받은 요청"
      }
      title={
        locale === "en" ? "Customer requests waiting for a response" : locale === "fil" ? "Customer requests waiting for a response" : "고객 요청을 검토하고 빠르게 응답하세요"
      }
      description={
        locale === "en"
          ? "Tradesman mode should open with incoming work first, not customer shopping pages."
          : locale === "fil"
            ? "Dapat incoming work muna ang makita sa tradesman mode, hindi customer shopping pages."
            : "전문가 모드에서는 고객 쇼핑 화면보다 받은 요청과 작업 검토가 먼저 보여야 합니다."
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
        <section className="grid gap-4">
          {requestsResult ? (
            <article className="rounded-3xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm text-teal-950">
              <p className="font-bold text-teal-900">
                {requestsResult.source === "database"
                  ? "실제 받은 요청을 보여주고 있습니다."
                  : "아직 실제 받은 요청이 없습니다."}
              </p>
              <p className="mt-2 leading-6 text-teal-800">
                {requestsResult.source === "database"
                  ? "알림과 받은 요청 목록에서 DB에 저장된 실제 요청을 열 수 있습니다."
                  : "전문가 기술 카테고리와 맞는 실제 요청이 생기면 여기에 표시됩니다."}
              </p>
            </article>
          ) : null}

          {requests.map((request) => (
            <article key={request.id} className="panel-shell p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xl font-bold text-slate-950">{request.serviceName}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {request.location} · {request.budgetLabel}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{request.summary}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-500">
                    {locale === "en" ? "Target date" : locale === "fil" ? "Target date" : "희망 일정"}
                  </p>
                  <p className="mt-1">{request.targetDate}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  href={`/quote-requests/${request.id}`}
                  className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800"
                >
                  {locale === "en"
                    ? "Review and send quote"
                    : locale === "fil"
                      ? "Suriin at magpadala ng quote"
                      : "검토 및 견적 보내기"}
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </PageShell>
  );
}
