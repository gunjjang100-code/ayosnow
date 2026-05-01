import { MyServicesManager } from "@/components/services/my-services-manager";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { getDemoSessionUser } from "@/lib/auth/session";
import { getFeaturedServices } from "@/lib/constants/mock-data";
import { getCurrentLocale } from "@/lib/i18n-server";
import {
  canAccessTradesmanWorkspace,
  getRoleAccessNoticeCopy,
} from "@/lib/role-ui";
import type { ManagedServiceItem } from "@/lib/types";

export default async function MyServicesPage() {
  const locale = await getCurrentLocale();
  const sessionUser = await getDemoSessionUser();
  const canUsePage = canAccessTradesmanWorkspace(sessionUser.role);
  const services = getFeaturedServices(locale);
  const filteredServices =
    sessionUser.role === "admin"
      ? services
      : services.filter((service) => service.providerName === sessionUser.name);
  const initialItems: ManagedServiceItem[] = filteredServices.map((service) => ({
    id: service.id,
    slug: service.slug,
    title: service.title,
    location: service.location,
    priceLabel: service.priceLabel,
    arrival: service.arrival,
    tags: service.tags,
    isActive: true,
  }));

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
          ? "보여 줄 서비스, 가격 느낌, 이동 가능 지역을 이 화면에서 정리하는 구조입니다."
          : locale === "fil"
            ? "Dito inaayos ang visible services, pricing feel, at travel coverage."
            : "This is where visible services, pricing posture, and travel coverage are organized."
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
        <MyServicesManager
          key={sessionUser.token}
          locale={locale}
          sessionToken={sessionUser.token}
          ownerName={sessionUser.name}
          initialItems={initialItems}
        />
      ) : null}
    </PageShell>
  );
}
