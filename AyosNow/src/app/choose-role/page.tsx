import { redirect } from "next/navigation";

import { RoleSelectionForm } from "@/components/auth/role-selection-form";
import { PageShell } from "@/components/shared/page-shell";
import { getSessionUser } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n-server";
import { getRoleHomePath } from "@/lib/role-ui";

const chooseRoleCopy = {
  en: {
    eyebrow: "Choose account role",
    title: "How would you like to use PuntaGo?",
    description:
      "If you signed up with Google for the first time, choose once whether you want to use PuntaGo as a customer or as a professional.",
  },
  fil: {
    eyebrow: "Pumili ng account role",
    title: "Paano mo gagamitin ang PuntaGo?",
    description:
      "Kung unang beses kang nag-sign up gamit ang Google, pumili kung gagamitin mo ang PuntaGo bilang customer o professional.",
  },
} as const;

export default async function ChooseRolePage() {
  const locale = await getCurrentLocale();
  const text = chooseRoleCopy[locale];
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?callbackUrl=/choose-role");
  }

  if (!sessionUser.needsRoleSelection) {
    redirect(getRoleHomePath(sessionUser.role));
  }

  return (
    <PageShell
      eyebrow={text.eyebrow}
      title={text.title}
      description={text.description}
    >
      <RoleSelectionForm locale={locale} />
    </PageShell>
  );
}
