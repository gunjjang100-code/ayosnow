"use client";

import Link from "next/link";

import type { Category } from "@/lib/types";

interface HomeCategoryChipsProps {
  initialCategories: Category[];
}

export function HomeCategoryChips({ initialCategories }: HomeCategoryChipsProps) {
  const categories = initialCategories;

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/services?category=${category.slug}`}
          className="chip transition hover:border-teal-300 hover:bg-teal-50"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
