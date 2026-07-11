"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type { Locale } from "@/lib/types";

interface TradesmanSkillManagerProps {
  locale: Locale;
  initialCategories: Array<{
    slug: string;
    name: string;
    description: string;
  }>;
  initialSelectedSlugs: string[];
}

const copy = {
  fil: {
    title: "Mga kategorya ng espesyalisasyon",
    description:
      "Ang mga bagong quote request alert ay ibabatay sa mga kategoryang pipiliin mo rito. Puwedeng pumili ng marami at ang unang napili ang magiging pangunahing skill.",
    empty: "Wala pang napiling espesyalisasyon.",
    selected: "Napili ngayon",
    save: "I-save ang mga skill",
    saving: "Sine-save...",
    success: "Na-save ang mga kategorya ng espesyalisasyon.",
    error: "Hindi na-save ang mga kategorya ng espesyalisasyon.",
  },
  en: {
    title: "Specialty categories",
    description:
      "New quote request alerts are matched against the categories you choose here. You can select more than one, and the first one becomes the primary skill.",
    empty: "No specialty category selected yet.",
    selected: "Currently selected",
    save: "Save specialties",
    saving: "Saving...",
    success: "Specialty categories saved.",
    error: "Could not save specialty categories.",
  },
} as const;

export function TradesmanSkillManager({
  locale,
  initialCategories,
  initialSelectedSlugs,
}: TradesmanSkillManagerProps) {
  const router = useRouter();
  const text = copy[locale];
  const [selectedSlugs, setSelectedSlugs] = useState(initialSelectedSlugs);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedItems = useMemo(
    () =>
      initialCategories.filter((category) => selectedSlugs.includes(category.slug)),
    [initialCategories, selectedSlugs],
  );

  function toggleCategory(slug: string) {
    setFeedback(null);
    setErrorMessage(null);
    setSelectedSlugs((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  }

  function handleSave() {
    setFeedback(null);
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tradesmen/skills", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categorySlugs: selectedSlugs,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: {
              formErrors?: string[];
              fieldErrors?: Record<string, string[]>;
            };
          }
        | null;

      if (!response.ok) {
        const fieldErrors = result?.error?.fieldErrors;
        const firstFieldError = fieldErrors
          ? Object.values(fieldErrors).flat().find(Boolean)
          : null;

        setErrorMessage(
          firstFieldError ?? result?.error?.formErrors?.[0] ?? text.error,
        );
        return;
      }

      setFeedback(text.success);
      router.refresh();
    });
  }

  return (
    <article className="soft-card p-5">
      <p className="text-lg font-bold text-slate-950">{text.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text.description}</p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">{text.selected}</p>
        {selectedItems.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedItems.map((category, index) => (
              <span
                key={category.slug}
                className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900"
              >
                {index === 0
                  ? `${category.name} · ${locale === "fil" ? "primary" : "primary"}`
                  : category.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{text.empty}</p>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {initialCategories.map((category) => {
          const isSelected = selectedSlugs.includes(category.slug);

          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => toggleCategory(category.slug)}
              className={`rounded-2xl border p-4 text-left transition ${
                isSelected
                  ? "border-teal-300 bg-teal-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-bold text-slate-950">{category.name}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {category.description}
              </p>
            </button>
          );
        })}
      </div>

      {errorMessage ? (
        <p className="mt-4 text-sm font-medium text-rose-600">{errorMessage}</p>
      ) : null}
      {feedback ? (
        <p className="mt-4 text-sm font-medium text-emerald-700">{feedback}</p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mt-4 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? text.saving : text.save}
      </button>
    </article>
  );
}
