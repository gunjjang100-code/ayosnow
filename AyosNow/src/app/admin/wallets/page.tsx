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
      title="Professional wallet / credit management"
      description="Review and adjust professional credit balances and quote fee deductions as admin."
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
