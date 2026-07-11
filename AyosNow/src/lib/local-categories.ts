import type { AdminCategoryItem, Category, Locale } from "@/lib/types";

const localizedSlugFallbackMap: Record<string, Record<Locale, string>> = {
  "home-interior": {
    fil: "Interior ng Bahay",
    en: "Home Interior",
  },
  "interior-design": {
    fil: "Disenyo ng Interior",
    en: "Interior Design",
  },
  "door-repair": {
    fil: "Pag-ayos ng Pinto",
    en: "Door Repair",
  },
};

const formatSlugToTitle = (slug: string) =>
  localizedSlugFallbackMap[slug]?.en ||
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getLocalizedSlugFallback = (slug: string, locale: Locale) =>
  localizedSlugFallbackMap[slug]?.[locale] || formatSlugToTitle(slug);

const normalizeAdminCategoryItem = (item: AdminCategoryItem): AdminCategoryItem => ({
  ...item,
  nameKo: item.nameKo ?? item.name ?? getLocalizedSlugFallback(item.slug, "en"),
  nameFil: item.nameFil ?? item.name ?? getLocalizedSlugFallback(item.slug, "fil"),
  nameEn: item.nameEn ?? item.name ?? getLocalizedSlugFallback(item.slug, "en"),
  descriptionKo: item.descriptionKo ?? item.description,
  descriptionFil:
    item.descriptionFil ??
    (item.description
      ? "Kategoryang idinagdag ng admin na may custom na paglalarawan."
      : undefined),
  descriptionEn:
    item.descriptionEn ??
    (item.description
      ? "Admin-added category with a custom description."
      : undefined),
});

export const getLocalizedAdminCategoryName = (
  item: AdminCategoryItem,
  locale: Locale,
) => {
  const normalizedItem = normalizeAdminCategoryItem(item);
  const localizedSlugFallback = getLocalizedSlugFallback(item.slug, locale);

  if (locale === "fil") {
    return (
      normalizedItem.nameFil ||
      normalizedItem.nameEn ||
      localizedSlugFallback
    );
  }

  return (
    normalizedItem.nameEn ||
    normalizedItem.nameFil ||
    localizedSlugFallback
  );
};

export const getLocalizedAdminCategoryDescription = (
  item: AdminCategoryItem,
  locale: Locale,
) => {
  const normalizedItem = normalizeAdminCategoryItem(item);

  if (locale === "fil") {
    return (
      normalizedItem.descriptionFil ||
      normalizedItem.descriptionEn ||
      "Bagong category na idinagdag ng admin."
    );
  }

  return (
    normalizedItem.descriptionEn ||
    normalizedItem.descriptionFil ||
    "New category added by admin."
  );
};

export const buildCategoryFromAdminItem = (
  item: AdminCategoryItem,
  locale: Locale,
): Category => ({
  slug: item.slug,
  name: getLocalizedAdminCategoryName(item, locale),
  shortDescription: getLocalizedAdminCategoryDescription(item, locale),
  startingPrice:
    locale === "fil"
      ? "Category na idinagdag ng admin"
      : "Admin-added category",
});

export const mergeCategoriesWithAdminItems = (
  initialCategories: Category[],
  adminItems: AdminCategoryItem[],
  locale: Locale,
) => {
  const mergedCategories = [...initialCategories];

  [...adminItems]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((item) => {
      const alreadyExists = mergedCategories.some(
        (category) => category.slug === item.slug,
      );

      if (!alreadyExists) {
        mergedCategories.push(buildCategoryFromAdminItem(item, locale));
      }
    });

  return mergedCategories;
};
