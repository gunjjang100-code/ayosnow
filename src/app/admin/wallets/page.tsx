import { WalletTable } from "@/components/admin/WalletTable";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { listAdminWallets } from "@/lib/admin/wallet-admin-service";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { canAccessAdminWorkspace, getRoleAccessNoticeCopy } from "@/lib/role-ui";
import { getCurrentLocale } from "@/lib/i18n-server";

export default async function AdminWalletsPage() {
  const locale = await getCurrentLocale();
  const sessionUser = await getOptionalSessionUser();
  const canUseAdminWorkspace = canAccessAdminWorkspace(sessionUser.role);
  const wallets = canUseAdminWorkspace ? await listAdminWallets() : [];

  return (
    <PageShell
      eyebrow="Admin Wallets"
      title="전문가 지갑 / 크레딧 관리"
      description="전문가 크레딧 잔액과 견적료 차감 내역을 관리자 기준으로 확인하고 조정합니다."
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
        <WalletTable initialWallets={wallets} />
      )}
    </PageShell>
  );
}
