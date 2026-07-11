"use client";

import Link from "next/link";

import type { Category } from "@/lib/types";

interface CategoryGridProps {
  initialCategories: Category[];
}

export function CategoryGrid({ initialCategories }: CategoryGridProps) {
  const categories = initialCategories;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/services?category=${category.slug}`}
          className="soft-card block p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_36px_-26px_rgba(13,148,136,0.45)]"
        >
          <span className="chip">{category.startingPrice}</span>
          <h2 className="mt-4 text-2xl font-bold text-slate-950">{category.name}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{category.shortDescription}</p>
        </Link>
      ))}
    </section>
  );
}
