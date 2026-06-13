import { MyServicesManager } from "@/components/services/my-services-manager";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { getSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import { getRoleAccessNoticeCopy } from "@/lib/role-ui";
import { listManagedServicesForUser } from "@/lib/services/my-services-service";
import type { UserRole } from "@/lib/types";

export default async function MyServicesPage() {
  const locale = await getCurrentLocale();
  const sessionUser = await getSessionUser();
  const currentRole: UserRole = sessionUser?.role ?? "customer";
  const canUsePage = sessionUser?.role === "tradesman";
  const initialItems = sessionUser
    ? await listManagedServicesForUser({
        userId: sessionUser.id,
        role: currentRole,
      })
    : [];

  return (
    <PageShell
      eyebrow={locale === "ko" ? "내 서비스" : "My services"}
      title={
        locale === "ko"
          ? "전문가가 직접 관리하는 서비스 목록"
          : locale === "fil"
            ? "Mga serbisyong pinapamahalaan mismo ng tradesman"
            : "Services managed by the tradesman"
      }
      description={
        locale === "ko"
          ? "고객에게 보여 줄 서비스, 가격대, 방문 가능 지역을 이 화면에서 관리합니다."
          : locale === "fil"
            ? "Dito inaayos ang visible services, pricing feel, at travel coverage."
            : "This is where visible services, pricing posture, and travel coverage are organized."
      }
    >
      {!canUsePage ? (
        <RoleAccessNotice
          {...getRoleAccessNoticeCopy({
            locale,
            currentRole,
            targetWorkspace: "tradesman-workspace",
          })}
        />
      ) : null}

      {canUsePage && sessionUser ? (
        <MyServicesManager
          key={sessionUser.id}
          locale={locale}
          ownerName={sessionUser.name}
          initialItems={initialItems}
        />
      ) : null}
    </PageShell>
  );
}
