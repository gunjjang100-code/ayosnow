import { redirect } from "next/navigation";

import { RoleSelectionForm } from "@/components/auth/role-selection-form";
import { PageShell } from "@/components/shared/page-shell";
import { getSessionUser } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/role-ui";

export default async function ChooseRolePage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?callbackUrl=/choose-role");
  }

  if (!sessionUser.needsRoleSelection) {
    redirect(getRoleHomePath(sessionUser.role));
  }

  return (
    <PageShell
      eyebrow="가입 역할 선택"
      title="AyosNow를 어떻게 이용할지 선택해 주세요."
      description="Google로 처음 가입한 경우, 고객으로 이용할지 전문가로 활동할지 한 번만 선택해야 합니다."
    >
      <RoleSelectionForm />
    </PageShell>
  );
}
