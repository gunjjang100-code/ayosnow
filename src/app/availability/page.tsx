import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  canAccessTradesmanWorkspace,
  getRoleAccessNoticeCopy,
} from "@/lib/role-ui";

const availabilityBlocks = [
  { day: "Mon", hours: "09:00 - 18:00" },
  { day: "Tue", hours: "09:00 - 18:00" },
  { day: "Wed", hours: "10:00 - 19:00" },
  { day: "Thu", hours: "09:00 - 18:00" },
  { day: "Fri", hours: "09:00 - 17:00" },
];

export default async function AvailabilityPage() {
  const locale = await getCurrentLocale();
  const sessionUser = await getOptionalSessionUser();
  const canUsePage = canAccessTradesmanWorkspace(sessionUser.role);

  return (
    <PageShell
      eyebrow={locale === "ko" ? "가능 시간 관리" : "Availability"}
      title={
        locale === "ko"
          ? "예약 가능한 시간대를 먼저 관리하세요"
          : locale === "fil"
            ? "Ayusin muna ang iyong available hours"
            : "Manage available hours before new jobs arrive"
      }
      description={
        locale === "ko"
          ? "고객이 예약 가능한 시간을 쉽게 확인할 수 있도록 가능 시간을 관리해 주세요."
          : locale === "fil"
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
        <section className="grid gap-4 md:grid-cols-2">
          {availabilityBlocks.map((block) => (
            <article key={block.day} className="panel-shell p-5">
              <p className="text-xl font-bold text-slate-950">{block.day}</p>
              <p className="mt-2 text-sm text-slate-600">{block.hours}</p>
            </article>
          ))}
        </section>
      ) : null}
    </PageShell>
  );
}
