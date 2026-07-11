"use client";

import { useState, useTransition } from "react";

import {
  getLocalizedAdminCategoryDescription,
  getLocalizedAdminCategoryName,
} from "@/lib/local-categories";
import {
  adminCategoryCreateSchema,
  adminCategoryUpdateSchema,
} from "@/lib/validations/admin-category";
import type { AdminCategoryItem, Locale } from "@/lib/types";

interface AdminCategoryManagerText {
  adminCategoriesPanel: string;
  adminCategoriesDescription: string;
  adminCategoryAddAction: string;
  adminCategoryCloseAction: string;
  adminCategoryEditAction: string;
  adminCategoryDeleteAction: string;
  adminCategoryCancelEditAction: string;
  adminCategoryFormTitle: string;
  adminCategoryFormDescription: string;
  adminCategoryEditTitle: string;
  adminCategoryEditDescription: string;
  adminCategoryNameFilLabel: string;
  adminCategoryNameEnLabel: string;
  adminCategorySlugLabel: string;
  adminCategorySlugHint: string;
  adminCategoryDescriptionFilLabel: string;
  adminCategoryDescriptionEnLabel: string;
  adminCategoryDescriptionHint: string;
  adminCategoryAutoTranslateHint: string;
  adminCategoryOrderLabel: string;
  adminCategoryFeaturedLabel: string;
  adminCategoryActiveLabel: string;
  adminCategorySaveAction: string;
  adminCategoryUpdateAction: string;
  adminCategoryAddedMessage: string;
  adminCategoryUpdatedMessage: string;
  adminCategoryDeletedMessage: string;
  adminCategoryDeleteConfirm: string;
  adminCategoryNameFilError: string;
  adminCategoryNameEnError: string;
  adminCategorySlugError: string;
  adminCategoryDuplicateSlugError: string;
  adminCategoryDescriptionFilError: string;
  adminCategoryDescriptionEnError: string;
  adminCategoryOrderError: string;
  adminCategoryStatusLive: string;
  adminCategoryStatusHidden: string;
  adminCategoryFeaturedChip: string;
  adminColumnCount: string;
  adminColumnOrder: string;
}

interface AdminCategoryManagerProps {
  initialItems: AdminCategoryItem[];
  locale: Locale;
  text: AdminCategoryManagerText;
}

interface CategoryFormState {
  nameKo: string;
  nameFil: string;
  nameEn: string;
  slug: string;
  descriptionKo: string;
  descriptionFil: string;
  descriptionEn: string;
  displayOrder: string;
  featured: boolean;
  isActive: boolean;
}

interface CategoryFieldErrors {
  nameFil?: string;
  nameEn?: string;
  slug?: string;
  descriptionFil?: string;
  descriptionEn?: string;
  displayOrder?: string;
}

const initialFormState: CategoryFormState = {
  nameKo: "",
  nameFil: "",
  nameEn: "",
  slug: "",
  descriptionKo: "",
  descriptionFil: "",
  descriptionEn: "",
  displayOrder: "0",
  featured: false,
  isActive: true,
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function AdminCategoryManager({
  initialItems,
  locale,
  text,
}: AdminCategoryManagerProps) {
  const [items, setItems] = useState(() =>
    [...initialItems].sort((left, right) => left.sortOrder - right.sortOrder),
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const [notice, setNotice] = useState("");
  const [isSaving, startSaving] = useTransition();

  const resetFormState = () => {
    setFormState(initialFormState);
  };

  const getIsActive = (item: AdminCategoryItem) =>
    typeof item.isActive === "boolean"
    ? item.isActive
    : item.statusLabel !== "Inactive" &&
          item.statusLabel !== "Hidden" &&
          item.statusLabel !== "Nakatago";

  const getLocalizedStatusLabel = (isActive: boolean) =>
    isActive ? text.adminCategoryStatusLive : text.adminCategoryStatusHidden;

  const handleInputChange =
    (field: keyof CategoryFormState) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const nextValue =
        event.target instanceof HTMLInputElement && event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;

      setFormState((current) => ({
        ...current,
        [field]: nextValue,
      }));

      setFieldErrors((current) => ({ ...current, [field]: undefined }));
      setNotice("");
    };

  const validateForm = (value: CategoryFormState) => {
    const nextErrors: CategoryFieldErrors = {};

    if (value.nameFil.trim().length < 2) {
      nextErrors.nameFil = text.adminCategoryNameFilError;
    }

    if (value.nameEn.trim().length < 2) {
      nextErrors.nameEn = text.adminCategoryNameEnError;
    }

    if (!slugPattern.test(value.slug.trim())) {
      nextErrors.slug = text.adminCategorySlugError;
    }

    const duplicatedItem = items.find(
      (item) => item.slug === value.slug.trim() && item.id !== editingItemId,
    );
    if (duplicatedItem) {
      nextErrors.slug = text.adminCategoryDuplicateSlugError;
    }

    if (value.descriptionFil.trim().length < 10) {
      nextErrors.descriptionFil = text.adminCategoryDescriptionFilError;
    }

    if (value.descriptionEn.trim().length < 10) {
      nextErrors.descriptionEn = text.adminCategoryDescriptionEnError;
    }

    if (Number.isNaN(Number(value.displayOrder)) || Number(value.displayOrder) < 0) {
      nextErrors.displayOrder = text.adminCategoryOrderError;
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(formState);
    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors(nextErrors);
      return;
    }

    const payload = {
      slug: formState.slug,
      nameKo: formState.nameEn,
      nameFil: formState.nameFil,
      nameEn: formState.nameEn,
      descriptionKo: formState.descriptionEn,
      descriptionFil: formState.descriptionFil,
      descriptionEn: formState.descriptionEn,
      displayOrder: formState.displayOrder,
      featured: formState.featured,
      isActive: formState.isActive,
    };
    const parsed = editingItemId
      ? adminCategoryUpdateSchema.safeParse({
          id: editingItemId,
          ...payload,
        })
      : adminCategoryCreateSchema.safeParse(payload);

    if (!parsed.success) {
      setFieldErrors(validateForm(formState));
      return;
    }

    startSaving(async () => {
      const response = await fetch(
        editingItemId
          ? `/api/admin/categories/${editingItemId}?locale=${locale}`
          : `/api/admin/categories?locale=${locale}`,
        {
          method: editingItemId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | { category?: AdminCategoryItem; error?: string }
        | null;

      if (!response.ok || !result?.category) {
        setNotice(result?.error ?? "Could not save the category.");
        return;
      }

      // 서버 DB가 진짜 저장소입니다. 화면 목록은 서버가 돌려준 값으로만 갱신합니다.
      const savedCategory = result.category;
      setItems((currentItems) => {
        const nextItems = editingItemId
          ? currentItems.map((item) =>
              item.id === editingItemId ? savedCategory : item,
            )
          : [...currentItems, savedCategory];

        return nextItems.sort((left, right) => left.sortOrder - right.sortOrder);
      });

      resetFormState();
      setEditingItemId(null);
      setFieldErrors({});
      setNotice(
        editingItemId
          ? text.adminCategoryUpdatedMessage
          : text.adminCategoryAddedMessage,
      );
      setIsFormOpen(false);
    });
  };

  const handleStartEdit = (item: AdminCategoryItem) => {
    setEditingItemId(item.id);
    setFormState({
      nameKo: item.nameEn ?? item.name ?? getLocalizedAdminCategoryName(item, "en"),
      nameFil: item.nameFil ?? getLocalizedAdminCategoryName(item, "fil"),
      nameEn: item.nameEn ?? getLocalizedAdminCategoryName(item, "en"),
      slug: item.slug,
      descriptionKo:
        item.descriptionEn ??
        item.description ??
        getLocalizedAdminCategoryDescription(item, "en"),
      descriptionFil:
        item.descriptionFil ??
        getLocalizedAdminCategoryDescription(item, "fil"),
      descriptionEn:
        item.descriptionEn ??
        getLocalizedAdminCategoryDescription(item, "en"),
      displayOrder: String(item.sortOrder),
      featured: Boolean(item.featured),
      isActive: getIsActive(item),
    });
    setFieldErrors({});
    setNotice("");
    setIsFormOpen(true);
  };

  const handleDelete = (itemId: string) => {
    const canDelete = window.confirm(text.adminCategoryDeleteConfirm);
    if (!canDelete) {
      return;
    }

    startSaving(async () => {
      const response = await fetch(`/api/admin/categories/${itemId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setNotice(result?.error ?? "Could not delete the category.");
        return;
      }

      setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));

      if (editingItemId === itemId) {
        setEditingItemId(null);
        resetFormState();
        setIsFormOpen(false);
      }

      setFieldErrors({});
      setNotice(text.adminCategoryDeletedMessage);
    });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItemId(null);
    resetFormState();
    setFieldErrors({});
    setNotice("");
  };

  return (
    <article className="soft-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{text.adminCategoriesPanel}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {text.adminCategoriesDescription}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isFormOpen) {
              handleCloseForm();
              return;
            }

            setIsFormOpen(true);
            setEditingItemId(null);
            resetFormState();
            setFieldErrors({});
            setNotice("");
          }}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
        >
          {isFormOpen
            ? editingItemId
              ? text.adminCategoryCancelEditAction
              : text.adminCategoryCloseAction
            : text.adminCategoryAddAction}
        </button>
      </div>

      {isFormOpen ? (
        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
        >
          <div>
            <p className="text-base font-bold text-slate-950">
              {editingItemId ? text.adminCategoryEditTitle : text.adminCategoryFormTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {editingItemId
                ? text.adminCategoryEditDescription
                : text.adminCategoryFormDescription}
            </p>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>{text.adminCategoryNameFilLabel}</span>
              <input
                value={formState.nameFil}
                onChange={handleInputChange("nameFil")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500"
                placeholder="Hal: Interior ng Bahay"
              />
              <span className="text-xs leading-5 text-slate-500">
                {text.adminCategoryAutoTranslateHint}
              </span>
              {fieldErrors.nameFil ? (
                <span className="text-xs font-semibold text-rose-600">{fieldErrors.nameFil}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>{text.adminCategoryNameEnLabel}</span>
              <input
                value={formState.nameEn}
                onChange={handleInputChange("nameEn")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500"
                placeholder="Example: Home Interior"
              />
              <span className="text-xs leading-5 text-slate-500">
                {text.adminCategoryAutoTranslateHint}
              </span>
              {fieldErrors.nameEn ? (
                <span className="text-xs font-semibold text-rose-600">{fieldErrors.nameEn}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>{text.adminCategorySlugLabel}</span>
              <input
                value={formState.slug}
                onChange={handleInputChange("slug")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500"
                placeholder="door-repair"
              />
              <span className="text-xs leading-5 text-slate-500">{text.adminCategorySlugHint}</span>
              {fieldErrors.slug ? (
                <span className="text-xs font-semibold text-rose-600">{fieldErrors.slug}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800 xl:col-span-2">
              <span>{text.adminCategoryDescriptionFilLabel}</span>
              <textarea
                value={formState.descriptionFil}
                onChange={handleInputChange("descriptionFil")}
                rows={4}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500"
                placeholder="Hal: Para sa partial renovation, wallpaper, ilaw, at layout consultation."
              />
              <span className="text-xs leading-5 text-slate-500">
                {text.adminCategoryAutoTranslateHint}
              </span>
              {fieldErrors.descriptionFil ? (
                <span className="text-xs font-semibold text-rose-600">
                  {fieldErrors.descriptionFil}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800 xl:col-span-2">
              <span>{text.adminCategoryDescriptionEnLabel}</span>
              <textarea
                value={formState.descriptionEn}
                onChange={handleInputChange("descriptionEn")}
                rows={4}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500"
                placeholder="Example: Connects customers with partial renovation, wallpaper, lighting, and layout consultation."
              />
              <span className="text-xs leading-5 text-slate-500">
                {text.adminCategoryAutoTranslateHint}
              </span>
              {fieldErrors.descriptionEn ? (
                <span className="text-xs font-semibold text-rose-600">
                  {fieldErrors.descriptionEn}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>{text.adminCategoryOrderLabel}</span>
              <input
                type="number"
                min={0}
                value={formState.displayOrder}
                onChange={handleInputChange("displayOrder")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500"
              />
              {fieldErrors.displayOrder ? (
                <span className="text-xs font-semibold text-rose-600">
                  {fieldErrors.displayOrder}
                </span>
              ) : null}
            </label>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.featured}
                  onChange={handleInputChange("featured")}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700"
                />
                <span>{text.adminCategoryFeaturedLabel}</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={handleInputChange("isActive")}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700"
                />
                <span>{text.adminCategoryActiveLabel}</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {notice ? <p className="text-sm font-semibold text-teal-700">{notice}</p> : <span />}
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving
                ? "Saving..."
                : editingItemId
                  ? text.adminCategoryUpdateAction
                  : text.adminCategorySaveAction}
            </button>
          </div>
        </form>
      ) : null}

      {notice ? <p className="mt-5 text-sm font-semibold text-teal-700">{notice}</p> : null}

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-950">
                    {getLocalizedAdminCategoryName(item, locale)}
                  </p>
                  {item.featured ? <span className="chip">{text.adminCategoryFeaturedChip}</span> : null}
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.slug}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {getLocalizedAdminCategoryDescription(item, locale)}
                </p>
              </div>
                  <span className="chip">{getLocalizedStatusLabel(getIsActive(item))}</span>
                </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p>
                {text.adminColumnCount}: {item.serviceCount}
              </p>
              <p>
                {text.adminColumnOrder}: {item.sortOrder}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStartEdit(item)}
                disabled={isSaving}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {text.adminCategoryEditAction}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={isSaving}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {text.adminCategoryDeleteAction}
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
