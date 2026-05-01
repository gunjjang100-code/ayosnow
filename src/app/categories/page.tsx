import { CategoryGrid } from "@/components/shared/category-grid";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { getDemoSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listMarketplaceCategories } from "@/lib/marketplace/catalog-service";
import { canAccessCustomerMarketplace, getRoleAccessNoticeCopy } from "@/lib/role-ui";

export default async function CategoriesPage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getDemoSessionUser();
  const categories = await listMarketplaceCategories(locale);

  return (
    <PageShell
      eyebrow="Categories"
      title={text.categoriesTitle}
      description={text.categoriesDescription}
    >
      {canAccessCustomerMarketplace(sessionUser.role) ? (
        categories.length > 0 ? (
          <CategoryGrid key={locale} initialCategories={categories} />
        ) : (
          <article className="panel-shell p-6">
            <p className="text-lg font-bold text-slate-950">등록된 카테고리가 아직 없습니다.</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              관리자 화면에서 운영 카테고리를 추가하면 고객 화면에 바로 표시됩니다.
            </p>
          </article>
        )
      ) : (
        <RoleAccessNotice
          {...getRoleAccessNoticeCopy({
            locale,
            currentRole: sessionUser.role,
            targetWorkspace: "customer-marketplace",
          })}
        />
      )}
    </PageShell>
  );
}
