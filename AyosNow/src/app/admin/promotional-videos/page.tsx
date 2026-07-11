import { AdminPromotionalVideoManager } from "@/components/admin/admin-promotional-video-manager";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import { getPromotionalVideoSettings } from "@/lib/promotional-videos/promotional-video-service";
import { canAccessAdminWorkspace, getRoleAccessNoticeCopy } from "@/lib/role-ui";

export const dynamic = "force-dynamic";

export default async function AdminPromotionalVideosPage() {
  const locale = await getCurrentLocale();
  const sessionUser = await getOptionalSessionUser();
  const canUseAdminWorkspace = canAccessAdminWorkspace(sessionUser.role);
  const settings = canUseAdminWorkspace
    ? await getPromotionalVideoSettings()
    : { videoUrls: ["", "", ""] as [string, string, string] };

  return (
    <PageShell
      eyebrow="Admin · Promotional Videos"
      title="Manage the videos shown on PuntaGo."
      description="Replace or remove the three YouTube links at any time. Changes appear without rebuilding or redeploying the application."
    >
      {!canUseAdminWorkspace ? (
        <RoleAccessNotice
          {...getRoleAccessNoticeCopy({
            locale,
            currentRole: sessionUser.role,
            targetWorkspace: "admin-workspace",
          })}
        />
      ) : (
        <AdminPromotionalVideoManager initialVideoUrls={settings.videoUrls} />
      )}
    </PageShell>
  );
}
