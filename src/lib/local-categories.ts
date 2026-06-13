import type { AdminCategoryItem, Category, Locale } from "@/lib/types";

const localizedSlugFallbackMap: Record<string, Record<Locale, string>> = {
  "home-interior": {
    ko: "홈 인테리어",
    fil: "Interior ng Bahay",
    en: "Home Interior",
  },
  "interior-design": {
    ko: "인테리어 디자인",
    fil: "Disenyo ng Interior",
    en: "Interior Design",
  },
  "door-repair": {
    ko: "문 수리",
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
  nameKo: item.nameKo ?? item.name ?? getLocalizedSlugFallback(item.slug, "ko"),
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
      normalizedItem.nameKo ||
      normalizedItem.nameEn ||
      localizedSlugFallback
    );
  }

  if (locale === "en") {
    return (
      normalizedItem.nameEn ||
      normalizedItem.nameFil ||
      normalizedItem.nameKo ||
      localizedSlugFallback
    );
  }

  return (
    normalizedItem.nameKo ||
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
      normalizedItem.descriptionKo ||
      normalizedItem.descriptionEn ||
      "Bagong category na idinagdag ng admin."
    );
  }

  if (locale === "en") {
    return (
      normalizedItem.descriptionEn ||
      normalizedItem.descriptionFil ||
      normalizedItem.descriptionKo ||
      "New category added by admin."
    );
  }

  return (
    normalizedItem.descriptionKo ||
    normalizedItem.descriptionFil ||
    normalizedItem.descriptionEn ||
    "관리자가 추가한 새 카테고리입니다."
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
    locale === "ko"
      ? "관리자 추가 카테고리"
      : locale === "fil"
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
