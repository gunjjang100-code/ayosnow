import { PageShell } from "@/components/shared/page-shell";
import { PushNotificationSettings } from "@/components/notifications/push-notification-settings";
import { TradesmanSkillManager } from "@/components/profile/tradesman-skill-manager";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { listBookingPreviewsForUser } from "@/lib/bookings/list-bookings-service";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { getWebPushPublicKey } from "@/lib/push/web-push";
import { listQuoteWorkspaceForCustomer } from "@/lib/quotes/service";
import { listTradesmanSkillSettings } from "@/lib/tradesmen/tradesman-skill-settings-service";

export default async function ProfilePage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
  const quoteRequests = sessionUser.role === "customer"
    ? await listQuoteWorkspaceForCustomer(sessionUser.id).catch(() => [])
    : [];
  const bookings = await listBookingPreviewsForUser({
    sessionUserId: sessionUser.id,
    role: sessionUser.role,
    locale,
  }).catch(() => []);
  const webPushPublicKey = getWebPushPublicKey();
  const isCustomer = sessionUser.role === "customer";
  const isTradesman = sessionUser.role === "tradesman";
  const tradesmanSkillSettings = isTradesman
    ? await listTradesmanSkillSettings(sessionUser.id)
    : null;

  const profileTitle =
    sessionUser.role === "admin"
      ? locale === "en"
        ? "Admin profile"
        : locale === "fil"
          ? "Admin profile"
          : "관리자 프로필"
      : text.profileTitle;

  const profileDescription = isCustomer
    ? text.profileDescription
    : isTradesman
      ? locale === "en"
        ? "Manage your services, portfolio, and work settings from one place."
        : locale === "fil"
          ? "Pamahalaan ang iyong serbisyo, portfolio, at work settings sa iisang lugar."
          : "내 서비스, 포트폴리오, 작업 설정을 한 곳에서 관리합니다."
      : locale === "en"
        ? "Check account role, moderation scope, and operating information."
        : locale === "fil"
          ? "Suriin ang role ng account, moderation scope, at operating information."
          : "계정 역할, 운영 범위, 관리 정보를 확인합니다.";

  return (
    <PageShell
      eyebrow={text.profileEyebrow}
      title={profileTitle}
      description={profileDescription}
    >
      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="soft-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-xl font-bold text-white">
              {sessionUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-950">{sessionUser.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {text.profileAccountType} ·{" "}
                {isCustomer
                  ? "Quezon City"
                  : isTradesman
                    ? "Pasig"
                    : locale === "en"
                      ? "Operations center"
                      : locale === "fil"
                        ? "Operations center"
                        : "운영 센터"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm leading-6 text-slate-700">
            {isCustomer ? (
              <>
                <div className="rounded-2xl bg-slate-50 p-4">{text.profilePaymentMethod}</div>
                <div className="rounded-2xl bg-slate-50 p-4">{text.profilePreferredCategories}</div>
                <div className="rounded-2xl bg-slate-50 p-4">{text.profileReviewsWritten}</div>
              </>
            ) : null}

            {isTradesman ? (
              <>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "Service areas · Pasig, Mandaluyong, Quezon City"
                    : locale === "fil"
                      ? "Service areas · Pasig, Mandaluyong, Quezon City"
                      : "서비스 지역 · Pasig, Mandaluyong, Quezon City"}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "Portfolio and certificates can be managed here."
                    : locale === "fil"
                      ? "Dito pinapamahalaan ang portfolio at certificates."
                      : "포트폴리오와 자격증을 이곳에서 관리합니다."}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "Availability, response speed, and credit settings belong to this profile."
                    : locale === "fil"
                      ? "Kasama sa profile na ito ang availability, response speed, at credit settings."
                      : "가능 시간, 응답 속도, 크레딧 설정이 이 프로필에 연결됩니다."}
                </div>
              </>
            ) : null}

            {sessionUser.role === "admin" ? (
              <>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "This account can review approvals, disputes, and one-out suspension cases."
                    : locale === "fil"
                      ? "Maaaring suriin ng account na ito ang approvals, disputes, at one-out suspension cases."
                      : "이 계정은 승인, 분쟁, 원아웃 정지 사례를 검토할 수 있습니다."}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "Review recent admin activity and account information."
                    : locale === "fil"
                      ? "Suriin ang recent admin activity at account information."
                      : "관리자 활동과 계정 정보를 확인합니다."}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "Admin accounts focus on operations management."
                    : locale === "fil"
                      ? "Nakatuon ang admin accounts sa operations management."
                      : "관리자 계정은 운영 관리 화면을 중심으로 사용합니다."}
                </div>
              </>
            ) : null}
          </div>
        </article>

        <div className="grid gap-4">
          {isCustomer ? (
            <>
              <PushNotificationSettings
                locale={locale}
                vapidPublicKey={webPushPublicKey}
              />

              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">{text.profileMyRequests}</p>
                <div className="mt-4 grid gap-3">
                  {quoteRequests.map((workspace) => (
                    <div key={workspace.request.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-bold text-slate-950">{workspace.request.serviceName}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {workspace.request.location} · {text.profileQuoteCount} {workspace.offers.length}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">{text.profileMyBookings}</p>
                <div className="mt-4 grid gap-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-bold text-slate-950">{booking.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{booking.dateLabel}</p>
                    </div>
                  ))}
                </div>
              </article>
            </>
          ) : null}

          {isTradesman ? (
            <>
              <PushNotificationSettings
                locale={locale}
                vapidPublicKey={webPushPublicKey}
              />

              {tradesmanSkillSettings ? (
                <TradesmanSkillManager
                  locale={locale}
                  initialCategories={tradesmanSkillSettings.categories}
                  initialSelectedSlugs={tradesmanSkillSettings.selectedCategorySlugs}
                />
              ) : null}

              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">
                  {locale === "en"
                    ? "My service setup"
                    : locale === "fil"
                      ? "My service setup"
                      : "내 서비스 설정"}
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    {locale === "en"
                      ? "Manage visible services, travel coverage, and base pricing."
                      : locale === "fil"
                        ? "Pamahalaan ang visible services, travel coverage, at base pricing."
                        : "노출 서비스, 이동 가능 지역, 기본 가격을 관리합니다."}
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    {locale === "en"
                      ? "Keep portfolio photos and work examples updated."
                      : locale === "fil"
                        ? "Panatilihing updated ang portfolio photos at work examples."
                        : "포트폴리오 사진과 작업 예시를 최신 상태로 유지합니다."}
                  </div>
                </div>
              </article>

              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">
                  {locale === "en"
                    ? "Work readiness"
                    : locale === "fil"
                      ? "Work readiness"
                      : "작업 준비 상태"}
                </p>
                <div className="mt-4 grid gap-3">
                  {bookings.slice(0, 2).map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-bold text-slate-950">{booking.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{booking.dateLabel}</p>
                    </div>
                  ))}
                </div>
              </article>
            </>
          ) : null}

          {sessionUser.role === "admin" ? (
            <>
              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">
                  {locale === "en"
                    ? "Operating scope"
                    : locale === "fil"
                      ? "Operating scope"
                      : "운영 범위"}
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    {locale === "en"
                      ? "Approvals, disputes, reports, and account suspension tools belong here."
                      : locale === "fil"
                        ? "Kasama rito ang approvals, disputes, reports, at account suspension tools."
                        : "승인, 분쟁, 리포트, 계정 정지 도구가 이 영역에 속합니다."}
                  </div>
                </div>
              </article>

              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">
                  {locale === "en"
                    ? "Recent moderation focus"
                    : locale === "fil"
                      ? "Recent moderation focus"
                      : "최근 운영 집중 항목"}
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    {locale === "en"
                      ? "Expert approval backlog, one-out risk review, and credit monitoring."
                      : locale === "fil"
                        ? "Expert approval backlog, one-out risk review, at credit monitoring."
                        : "전문가 승인 대기, 원아웃 위험 검토, 크레딧 모니터링이 우선입니다."}
                  </div>
                </div>
              </article>
            </>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
