import { CategoryGrid } from "@/components/shared/category-grid";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listMarketplaceCategories } from "@/lib/marketplace/catalog-service";
import { canAccessCustomerMarketplace, getRoleAccessNoticeCopy } from "@/lib/role-ui";

export default async function CategoriesPage() {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getOptionalSessionUser();
  const categories = await listMarketplaceCategories(locale);

  return (
    <PageShell
      eyebrow={text.categoriesEyebrow}
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
              준비되는 대로 이용 가능한 서비스 카테고리가 이곳에 표시됩니다.
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
