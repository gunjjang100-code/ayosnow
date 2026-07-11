import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listReceivedQuoteRequestsForWorkspace } from "@/lib/quote-requests/list-received-requests-service";
import {
  canAccessTradesmanWorkspace,
  getRoleAccessNoticeCopy,
} from "@/lib/role-ui";

export default async function RequestsPage() {
  const locale = await getCurrentLocale();
  const sessionUser = await getOptionalSessionUser();
  const canUsePage = canAccessTradesmanWorkspace(sessionUser.role);
  const requestsResult = canUsePage
    ? await listReceivedQuoteRequestsForWorkspace({
        userId: sessionUser.id,
        role: sessionUser.role === "tradesman" ? "TRADESMAN" : "ADMIN",
        locale,
      })
    : null;
  const requests = requestsResult?.source === "database" ? requestsResult.items : [];
  const emptyReason = requestsResult?.emptyReason;
  const emptyTitle =
    emptyReason === "unverified"
      ? locale === "fil"
        ? "Kailangan muna ng admin approval."
        : "Admin approval is required first."
      : emptyReason === "no-skills"
        ? locale === "fil"
          ? "Pumili muna ng service categories."
          : "Choose your service categories first."
        : locale === "fil"
          ? "Wala pang tugmang customer request."
          : "No matching customer requests yet.";
  const emptyDescription =
    emptyReason === "unverified"
      ? locale === "fil"
        ? "Hindi pa makakakita o makakasagot sa customer requests ang account hanggang ma-approve ito ng admin."
        : "This account cannot view or respond to customer requests until an admin approves the professional profile."
      : emptyReason === "no-skills"
        ? locale === "fil"
          ? "Idagdag ang mga service category sa profile para makatanggap ng tugmang requests."
          : "Add service categories to your profile so matching requests can appear here."
        : locale === "fil"
          ? "Lalabas dito ang open requests na tumutugma sa iyong approved service categories."
          : "Open requests that match your approved service categories will appear here.";

  return (
    <PageShell
      eyebrow={
        locale === "fil" ? "Incoming requests" : "Incoming requests"
      }
      title={
        locale === "fil" ? "Customer requests waiting for a response" : "Customer requests waiting for a response"
      }
      description={
        locale === "en"
          ? "Review customer requests and send quotes from one place."
          : locale === "fil"
            ? "Suriin ang customer requests at magpadala ng quotes sa iisang lugar."
            : "Review customer requests and send quotes from one place."
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
                {requests.length > 0
                  ? locale === "fil"
                    ? "Ipinapakita ang mga natanggap na request."
                    : "Showing incoming requests."
                  : emptyTitle}
              </p>
              <p className="mt-2 leading-6 text-teal-800">
                {requests.length > 0
                  ? locale === "fil"
                    ? "Dito mo makikita ang bagong customer requests."
                    : "New customer requests appear on this screen."
                  : emptyDescription}
              </p>
            </article>
          ) : null}

          {requests.map((request) => (
            <article key={request.id} className="panel-shell p-4 md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-black leading-tight text-slate-950">{request.serviceName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip border-slate-200 bg-slate-50 text-slate-700">{request.location}</span>
                    <span className="chip">{request.budgetLabel}</span>
                  </div>
                  <p className="mt-4 text-[15px] leading-7 text-slate-700">{request.summary}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 md:min-w-44">
                  <p className="font-semibold text-slate-500">
                    {locale === "fil" ? "Target date" : "Target date"}
                  </p>
                  <p className="mt-1">{request.targetDate}</p>
                </div>
              </div>
              <div className="mt-4 flex">
                <Link
                  href={`/quote-requests/${request.id}`}
                  className="mobile-primary-button w-full md:w-auto"
                >
                  {locale === "en"
                    ? "Review and send quote"
                    : locale === "fil"
                      ? "Suriin at magpadala ng quote"
                      : "Review and send quote"}
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </PageShell>
  );
}
