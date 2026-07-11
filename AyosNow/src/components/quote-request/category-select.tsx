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
    <div className="grid gap-2 sm:grid-cols-2">
      {categories.map((category, index) => {
        const isDefault = defaultValue
          ? category.slug === defaultValue
          : index === 0;

        return (
          <label
            key={category.slug}
            className="group relative flex min-h-16 cursor-pointer items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition active:border-teal-300 active:bg-teal-50"
          >
            <input
              type="radio"
              name={name}
              value={category.slug}
              defaultChecked={isDefault}
              className="peer sr-only"
            />
            <span className="absolute inset-0 rounded-2xl border-2 border-transparent peer-checked:border-teal-400 peer-checked:bg-teal-50/70" />
            <span className="relative z-10 leading-5 peer-checked:text-teal-950">
              {category.name}
            </span>
          </label>
        );
      })}
    </div>
  );
}
