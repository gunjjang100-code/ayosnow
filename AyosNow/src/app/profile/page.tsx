import Link from "next/link";
import Image from "next/image";

import { AccountDeletionPanel } from "@/components/profile/account-deletion-panel";
import { PageShell } from "@/components/shared/page-shell";
import { ProfessionalBadges } from "@/components/shared/professional-badges";
import { PushNotificationSettings } from "@/components/notifications/push-notification-settings";
import { TradesmanProfileEditor } from "@/components/profile/tradesman-profile-editor";
import { TradesmanSkillManager } from "@/components/profile/tradesman-skill-manager";
import { getAccountDeletionState } from "@/lib/account/account-deletion-service";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { listBookingPreviewsForUser } from "@/lib/bookings/list-bookings-service";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { getWebPushPublicKey } from "@/lib/push/web-push";
import { listQuoteWorkspaceForCustomer } from "@/lib/quotes/service";
import { getReferralSummary } from "@/lib/referrals/referral-service";
import { getTradesmanProfileEditorData } from "@/lib/tradesmen/manage-tradesman-profile-service";
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
  const isGuest = sessionUser.id === "guest";
  const referralSummary = isTradesman && sessionUser.id !== "guest"
    ? await getReferralSummary(sessionUser.id).catch(() => null)
    : null;
  const accountDeletionState = sessionUser.id !== "guest"
    ? await getAccountDeletionState(sessionUser.id).catch(() => ({ pendingRequest: null }))
    : { pendingRequest: null };
  const appUrl = (process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://puntago.net").replace(/\/$/, "");
  const tradesmanSkillSettings = isTradesman
    ? await listTradesmanSkillSettings(sessionUser.id)
    : null;
  const tradesmanProfileEditor = isTradesman
    ? await getTradesmanProfileEditorData(sessionUser.id)
    : null;

  const profileTitle =
    sessionUser.role === "admin"
      ? "Admin profile"
      : text.profileTitle;

  const profileDescription = isCustomer
    ? text.profileDescription
    : isTradesman
      ? locale === "fil"
          ? "Pamahalaan ang iyong serbisyo, portfolio, at work settings sa iisang lugar."
          : "Manage your services, portfolio, and work settings from one place."
      : locale === "fil"
          ? "Suriin ang role ng account, moderation scope, at operating information."
          : "Check account role, moderation scope, and operating information.";
  const accountTypeLabel = isTradesman
    ? "Professional account"
    : sessionUser.role === "admin"
      ? "Admin account"
      : text.profileAccountType;

  return (
    <PageShell
      eyebrow={text.profileEyebrow}
      title={profileTitle}
      description={profileDescription}
    >
      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <article className={isTradesman ? "soft-card order-2 p-5 lg:order-1" : "soft-card p-5"}>
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 overflow-hidden rounded-3xl bg-slate-950 text-xl font-bold text-white">
              {tradesmanProfileEditor?.avatarUrl ? (
                <Image
                  src={tradesmanProfileEditor.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  {sessionUser.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-950">{sessionUser.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {accountTypeLabel} ·{" "}
                {isCustomer
                  ? "Quezon City"
                  : isTradesman
                    ? "Pasig"
                    : locale === "fil"
                        ? "Operations center"
                        : "Operations center"}
              </p>
              {isTradesman ? (
                <div className="mt-2">
                  <ProfessionalBadges badges={tradesmanProfileEditor?.badges} compact />
                </div>
              ) : null}
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
                      : "Service areas · Pasig, Mandaluyong, Quezon City"}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "Portfolio and certificates can be managed here."
                    : locale === "fil"
                      ? "Dito pinapamahalaan ang portfolio at certificates."
                      : "Portfolio and certificates can be managed here."}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "Availability, response speed, and credit settings belong to this profile."
                    : locale === "fil"
                      ? "Kasama sa profile na ito ang availability, response speed, at credit settings."
                      : "Availability, response speed, and credit settings belong to this profile."}
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
                      : "This account can review approvals, disputes, and one-out suspension cases."}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "Review recent admin activity and account information."
                    : locale === "fil"
                      ? "Suriin ang recent admin activity at account information."
                      : "Review recent admin activity and account information."}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  {locale === "en"
                    ? "Admin accounts focus on operations management."
                    : locale === "fil"
                      ? "Nakatuon ang admin accounts sa operations management."
                      : "Admin accounts focus on operations management."}
                </div>
              </>
            ) : null}
          </div>
        </article>

        <div className={isTradesman ? "order-1 grid gap-4 lg:order-2" : "grid gap-4"}>
          {isTradesman ? (
            <>
              {tradesmanProfileEditor ? (
                <div id="professional-profile-editor" className="scroll-mt-28">
                  <TradesmanProfileEditor
                    locale={locale}
                    initialProfile={tradesmanProfileEditor}
                  />
                </div>
              ) : null}

              {tradesmanSkillSettings ? (
                <div id="professional-categories" className="scroll-mt-28">
                  <TradesmanSkillManager
                    locale={locale}
                    initialCategories={tradesmanSkillSettings.categories}
                    initialSelectedSlugs={tradesmanSkillSettings.selectedCategorySlugs}
                  />
                </div>
              ) : null}

              <article className="soft-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-slate-950">
                      {locale === "fil" ? "Professional settings" : "Professional settings"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {locale === "fil"
                        ? "Ayusin ang profile photo, serbisyo, portfolio, availability, at credits sa iisang lugar."
                        : "Manage your profile photo, services, portfolio, availability, and credits from one place."}
                    </p>
                  </div>
                  <span className="chip">Tradesman</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="#professional-profile-editor"
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-bold text-slate-800 transition hover:border-teal-200 hover:bg-teal-50 active:scale-[0.99]"
                  >
                    Profile photo & portfolio
                  </Link>
                  <Link
                    href="#professional-categories"
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-bold text-slate-800 transition hover:border-teal-200 hover:bg-teal-50 active:scale-[0.99]"
                  >
                    Service categories
                  </Link>
                  <Link
                    href="/availability"
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-bold text-slate-800 transition hover:border-teal-200 hover:bg-teal-50 active:scale-[0.99]"
                  >
                    Availability
                  </Link>
                  <Link
                    href="/settlements"
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-bold text-slate-800 transition hover:border-teal-200 hover:bg-teal-50 active:scale-[0.99]"
                  >
                    Credits
                  </Link>
                </div>
              </article>
            </>
          ) : null}

          {referralSummary ? (
            <article className="soft-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-slate-950">
                    {locale === "en"
                      ? "Professional referral rewards"
                      : locale === "fil"
                        ? "Professional referral rewards"
                        : "Professional referral rewards"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {locale === "en"
                      ? "Invite another professional. When they join with your code, quote credits are recorded here."
                      : locale === "fil"
                        ? "Mag-imbita ng kapwa professional. Kapag sumali sila gamit ang code mo, dito mare-record ang quote credits."
                        : "Invite another professional. When they join with your code, quote credits are recorded here."}
                  </p>
                </div>
                <span className="chip">
                  {referralSummary.isActive
                    ? locale === "en"
                      ? "Active"
                      : locale === "fil"
                        ? "Active"
                        : "Active"
                    : locale === "en"
                      ? "Paused"
                      : locale === "fil"
                        ? "Paused"
                        : "Paused"}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Code
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {referralSummary.referralCode}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Invites
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {referralSummary.referralCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Credits
                  </p>
                  <p className="mt-2 text-xl font-black text-teal-700">
                    {referralSummary.rewardCredits}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-teal-200 bg-teal-50/70 p-4 text-sm font-semibold text-teal-900">
                {`${appUrl}/signup?ref=${encodeURIComponent(referralSummary.referralCode)}`}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {locale === "en"
                  ? `Current reward: ${referralSummary.rewardPerSignup} quote credits per valid professional signup.`
                  : locale === "fil"
                    ? `Kasalukuyang reward: ${referralSummary.rewardPerSignup} quote credits bawat valid professional signup.`
                    : `Current reward: ${referralSummary.rewardPerSignup} quote credits per valid professional signup.`}
              </p>
            </article>
          ) : null}

          {isGuest ? (
            <article className="soft-card p-5">
              <p className="text-lg font-bold text-slate-950">
                {locale === "en"
                  ? "Sign in to turn on push alerts"
                  : locale === "fil"
                    ? "Mag-sign in para i-on ang push alerts"
                    : "Sign in to turn on push alerts"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {locale === "en"
                  ? "PuntaGo needs your account first so alerts can be saved to the right user."
                  : locale === "fil"
                    ? "Kailangan muna ng PuntaGo ang account mo para mai-save ang alerts sa tamang user."
                    : "PuntaGo needs your account first so alerts can be saved to the right user."}
              </p>
              <Link
                href="/login?callbackUrl=/profile"
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-bold !text-white shadow-[0_16px_28px_-22px_rgba(15,23,42,0.85)] transition hover:bg-teal-800 hover:!text-white active:scale-[0.98] active:bg-teal-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              >
                {locale === "en"
                  ? "Sign in"
                  : locale === "fil"
                    ? "Mag-sign in"
                    : "Sign in"}
              </Link>
            </article>
          ) : (
            <PushNotificationSettings
              locale={locale}
              vapidPublicKey={webPushPublicKey}
            />
          )}

          {isCustomer ? (
            <>
              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">{text.profileMyRequests}</p>
                <div className="mt-4 grid gap-3">
                  {quoteRequests.map((workspace) => (
                    <div
                      key={workspace.request.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-slate-950">{workspace.request.serviceName}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {workspace.request.location} · {text.profileQuoteCount} {workspace.offers.length}
                          </p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            {workspace.request.statusLabel}
                          </p>
                        </div>
                        <Link
                          href={`/quote-requests/${workspace.request.id}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900 transition hover:border-teal-300 hover:bg-teal-100 active:scale-[0.98]"
                        >
                          {locale === "fil" ? "I-manage / cancel" : "Manage / cancel"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">{text.profileMyBookings}</p>
                <div className="mt-4 grid gap-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-slate-950">{booking.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{booking.dateLabel}</p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            {booking.status}
                          </p>
                        </div>
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900 transition hover:border-teal-300 hover:bg-teal-100 active:scale-[0.98]"
                        >
                          {locale === "fil" ? "I-manage / cancel" : "Manage / cancel"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </>
          ) : null}

          {isTradesman ? (
            <>
              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">
                  {locale === "en"
                    ? "My service setup"
                    : locale === "fil"
                      ? "My service setup"
                      : "My service setup"}
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    {locale === "en"
                      ? "Manage visible services, travel coverage, and base pricing."
                      : locale === "fil"
                        ? "Pamahalaan ang visible services, travel coverage, at base pricing."
                        : "Manage visible services, travel coverage, and base pricing."}
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    {locale === "en"
                      ? "Keep portfolio photos and work examples updated."
                      : locale === "fil"
                        ? "Panatilihing updated ang portfolio photos at work examples."
                        : "Keep portfolio photos and work examples updated."}
                  </div>
                </div>
              </article>

              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">
                  {locale === "en"
                    ? "Work readiness"
                    : locale === "fil"
                      ? "Work readiness"
                      : "Work readiness"}
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
                      : "Operating scope"}
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    {locale === "en"
                      ? "Approvals, disputes, reports, and account suspension tools belong here."
                      : locale === "fil"
                        ? "Kasama rito ang approvals, disputes, reports, at account suspension tools."
                        : "Approvals, disputes, reports, and account suspension tools belong here."}
                  </div>
                </div>
              </article>

              <article className="soft-card p-5">
                <p className="text-lg font-bold text-slate-950">
                  {locale === "en"
                    ? "Recent moderation focus"
                    : locale === "fil"
                      ? "Recent moderation focus"
                      : "Recent moderation focus"}
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    {locale === "en"
                      ? "Expert approval backlog, one-out risk review, and credit monitoring."
                      : locale === "fil"
                        ? "Expert approval backlog, one-out risk review, at credit monitoring."
                        : "Expert approval backlog, one-out risk review, and credit monitoring."}
                  </div>
                </div>
              </article>
            </>
          ) : null}

          {!isGuest ? (
            <AccountDeletionPanel
              locale={locale}
              pendingRequest={
                accountDeletionState.pendingRequest
                  ? {
                      id: accountDeletionState.pendingRequest.id,
                      reason: accountDeletionState.pendingRequest.reason,
                      requestedAt: accountDeletionState.pendingRequest.requestedAt.toISOString(),
                    }
                  : null
              }
            />
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
