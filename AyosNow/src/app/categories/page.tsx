import { CategoryGrid } from "@/components/shared/category-grid";
import { PageShell } from "@/components/shared/page-shell";
import { RoleAccessNotice } from "@/components/shared/role-access-notice";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";
import { listMarketplaceCategories } from "@/lib/marketplace/catalog-service";
import { canAccessCustomerMarketplace, getRoleAccessNoticeCopy } from "@/lib/role-ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Service Categories",
  description:
    "Explore PuntaGo service categories for home services, events, care, beauty, wellness, education, business support, and more.",
  path: "/categories",
});

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
            <p className="text-lg font-bold text-slate-950">
              {locale === "fil"
                ? "Wala pang available na category."
                : "No categories are available yet."}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {locale === "fil"
                ? "Lalabas dito ang service categories kapag handa na ang mga ito."
                : "Available service categories will appear here once they are ready."}
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
