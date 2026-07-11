"use client";

import Link from "next/link";

import type { Category, Locale } from "@/lib/types";

interface HomeCategoryChipsProps {
  initialCategories: Category[];
  locale: Locale;
}

export function HomeCategoryChips({ initialCategories, locale }: HomeCategoryChipsProps) {
  const quickCategories = [
    {
      labels: { fil: "Aircon Cleaning", en: "Aircon Cleaning" },
      icon: "AC",
      fallbackQuery: "Aircon",
      searchTerms: ["aircon"],
    },
    {
      labels: { fil: "Plumbing", en: "Plumbing" },
      icon: "PL",
      fallbackQuery: "Plumbing",
      searchTerms: ["plumbing"],
    },
    {
      labels: { fil: "Electrical", en: "Electrical" },
      icon: "EL",
      fallbackQuery: "Electrical",
      searchTerms: ["electrical"],
    },
    {
      labels: { fil: "Cleaning", en: "Cleaning" },
      icon: "CL",
      fallbackQuery: "Cleaning",
      searchTerms: ["cleaning"],
    },
    {
      labels: { fil: "Painting", en: "Painting" },
      icon: "PT",
      fallbackQuery: "Painting",
      searchTerms: ["painting"],
    },
    {
      labels: { fil: "Furniture Assembly", en: "Furniture Assembly" },
      icon: "FA",
      fallbackQuery: "Furniture",
      searchTerms: ["furniture"],
    },
    {
      labels: { fil: "Moving", en: "Moving" },
      icon: "MV",
      fallbackQuery: "Moving",
      searchTerms: ["moving"],
    },
    {
      labels: { fil: "CCTV", en: "CCTV" },
      icon: "CC",
      fallbackQuery: "CCTV",
      searchTerms: ["cctv"],
    },
  ];

  function getCategoryHref(searchTerms: string[], fallbackQuery: string) {
    const matchedCategory = initialCategories.find((category) => {
      const categoryName = category.name.toLowerCase();
      const categorySlug = category.slug.toLowerCase();

      return searchTerms.some((term) => {
        const normalizedTerm = term.toLowerCase();

        return categoryName.includes(normalizedTerm) || categorySlug.includes(normalizedTerm);
      });
    });

    if (matchedCategory) {
      return `/services?category=${matchedCategory.slug}`;
    }

    return `/services?q=${encodeURIComponent(fallbackQuery)}`;
  }

  return (
    <div className="mt-7 grid grid-cols-4 gap-3 sm:grid-cols-8">
      {quickCategories.map((category) => (
        <Link
          key={category.fallbackQuery}
          href={getCategoryHref(category.searchTerms, category.fallbackQuery)}
          className="group flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center shadow-[0_14px_32px_-28px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white transition group-hover:bg-teal-700">
            {category.icon}
          </span>
          <span className="text-[11px] font-bold leading-4 text-slate-800">
            {category.labels[locale]}
          </span>
        </Link>
      ))}
    </div>
  );
}
