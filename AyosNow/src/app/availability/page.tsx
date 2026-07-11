import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { TradesmanAvailabilityEditor } from "@/components/profile/tradesman-availability-editor";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import { getRoleAccessNoticeCopy } from "@/lib/role-ui";
import { listTradesmanAvailability } from "@/lib/tradesmen/availability-service";

export default async function AvailabilityPage() {
  const locale = await getCurrentLocale();
  const sessionUser = await getOptionalSessionUser();
  const canUsePage = sessionUser.role === "tradesman";
  const availability = canUsePage
    ? await listTradesmanAvailability({
        userId: sessionUser.id,
        role: sessionUser.role,
        locale,
      })
    : [];

  return (
    <PageShell
      eyebrow={locale === "fil" ? "Availability" : "Availability"}
      title={
        locale === "fil"
            ? "Ayusin muna ang iyong available hours"
            : "Manage available hours before new jobs arrive"
      }
      description={
        locale === "fil"
            ? "Ayusin ang available hours para madaling makapili ang customer ng oras."
            : "Set the hours customers can choose for bookings."
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
        <TradesmanAvailabilityEditor locale={locale} initialItems={availability} />
      ) : null}
    </PageShell>
  );
}
