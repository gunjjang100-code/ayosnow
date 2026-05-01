"use client";

import type { Category } from "@/lib/types";

interface CategorySelectProps {
  initialCategories: Category[];
  name?: string;
  defaultValue?: string;
}

export function CategorySelect({
  initialCategories,
  name,
  defaultValue,
}: CategorySelectProps) {
  const categories = initialCategories;

  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
    >
      {categories.map((category) => (
        <option key={category.slug} value={category.slug}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
