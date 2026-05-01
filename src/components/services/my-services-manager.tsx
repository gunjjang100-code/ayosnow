"use client";

import { useState } from "react";

import type { Locale, ManagedServiceItem } from "@/lib/types";

interface MyServicesManagerProps {
  locale: Locale;
  sessionToken: string;
  ownerName: string;
  initialItems: ManagedServiceItem[];
}

interface ServiceFormState {
  title: string;
  location: string;
  priceLabel: string;
  arrival: string;
  tagsText: string;
}

interface ServiceFormErrors {
  title?: string;
  location?: string;
  priceLabel?: string;
  arrival?: string;
}

interface MyServicesText {
  panelTitle: string;
  panelDescription: string;
  browserSaveNotice: string;
  addAction: string;
  editAction: string;
  disableAction: string;
  enableAction: string;
  cancelAction: string;
  createAction: string;
  updateAction: string;
  createTitle: string;
  editTitle: string;
  titleLabel: string;
  locationLabel: string;
  priceLabel: string;
  arrivalLabel: string;
  tagsLabel: string;
  tagsHint: string;
  noItemsTitle: string;
  noItemsDescription: string;
  statusLive: string;
  statusHidden: string;
  createdMessage: string;
  updatedMessage: string;
  disabledMessage: string;
  enabledMessage: string;
  titleError: string;
  locationError: string;
  priceError: string;
  arrivalError: string;
  hiddenHint: string;
}

const emptyFormState: ServiceFormState = {
  title: "",
  location: "",
  priceLabel: "",
  arrival: "",
  tagsText: "",
};

function getMyServicesText(locale: Locale): MyServicesText {
  if (locale === "fil") {
    return {
      panelTitle: "Pamamahalaan ang mga serbisyong ipinapakita sa customer",
      panelDescription:
        "Dito puwedeng magdagdag, mag-edit, at pansamantalang itago ang serbisyo.",
      browserSaveNotice:
        "Pansamantala itong sine-save sa browser. Ikokonekta ito sa DB API sa susunod na hakbang.",
      addAction: "Magdagdag ng serbisyo",
      editAction: "I-edit",
      disableAction: "Itago",
      enableAction: "Ibalik",
      cancelAction: "Kanselahin",
      createAction: "I-save ang serbisyo",
      updateAction: "I-update ang serbisyo",
      createTitle: "Magdagdag ng bagong serbisyo",
      editTitle: "I-edit ang serbisyo",
      titleLabel: "Pangalan ng serbisyo",
      locationLabel: "Lugar ng biyahe",
      priceLabel: "Presyo",
      arrivalLabel: "Availability note",
      tagsLabel: "Tags",
      tagsHint: "Paghiwalayin sa kuwit. Hal: Instant booking, May dalang tools",
      noItemsTitle: "Wala pang serbisyong naka-display.",
      noItemsDescription:
        "Magdagdag muna ng serbisyo para may lumabas na working card sa page na ito.",
      statusLive: "Live",
      statusHidden: "Nakatago",
      createdMessage: "Naidagdag ang bagong serbisyo.",
      updatedMessage: "Na-update ang serbisyo.",
      disabledMessage: "Nakatago na muna ang serbisyo.",
      enabledMessage: "Ipinapakita ulit ang serbisyo.",
      titleError: "Maglagay ng pangalan ng serbisyo na may hindi bababa sa 2 letra.",
      locationError: "Maglagay ng lugar na may hindi bababa sa 2 letra.",
      priceError: "Maglagay ng malinaw na presyo o range.",
      arrivalError: "Maglagay ng maikling availability note.",
      hiddenHint: "Hindi muna ito makikita ng customer habang naka-hide.",
    };
  }

  if (locale === "en") {
    return {
      panelTitle: "Manage the services customers can see",
      panelDescription:
        "This is where the tradesman adds, edits, and temporarily hides services.",
      browserSaveNotice:
        "Changes are temporarily saved in this browser. The next step is connecting this to the DB API.",
      addAction: "Add service",
      editAction: "Edit",
      disableAction: "Hide",
      enableAction: "Show again",
      cancelAction: "Cancel",
      createAction: "Save service",
      updateAction: "Update service",
      createTitle: "Add a new service",
      editTitle: "Edit service",
      titleLabel: "Service title",
      locationLabel: "Travel area",
      priceLabel: "Price",
      arrivalLabel: "Availability note",
      tagsLabel: "Tags",
      tagsHint: "Separate with commas. Example: Instant booking, Tools included",
      noItemsTitle: "No visible services yet.",
      noItemsDescription:
        "Add a service first so this page shows a working service card.",
      statusLive: "Live",
      statusHidden: "Hidden",
      createdMessage: "A new service was added.",
      updatedMessage: "The service was updated.",
      disabledMessage: "The service is hidden for now.",
      enabledMessage: "The service is visible again.",
      titleError: "Enter a service title with at least 2 characters.",
      locationError: "Enter a travel area with at least 2 characters.",
      priceError: "Enter a clear price or range.",
      arrivalError: "Enter a short availability note.",
      hiddenHint: "Customers will not see this service while it stays hidden.",
    };
  }

  return {
    panelTitle: "고객에게 보여 줄 서비스를 여기서 직접 관리합니다",
    panelDescription:
      "전문가가 이 화면에서 서비스 등록, 수정, 숨김 전환까지 바로 할 수 있는 구조입니다.",
    browserSaveNotice:
      "현재는 이 브라우저에 임시 저장됩니다. 다음 단계에서 DB 저장 API로 연결해야 합니다.",
    addAction: "새 서비스 등록",
    editAction: "수정",
    disableAction: "끄기",
    enableAction: "다시 켜기",
    cancelAction: "취소",
    createAction: "서비스 저장",
    updateAction: "서비스 수정 저장",
    createTitle: "새 서비스 등록",
    editTitle: "서비스 수정",
    titleLabel: "서비스 이름",
    locationLabel: "출동 가능 지역",
    priceLabel: "가격 표기",
    arrivalLabel: "방문 가능 안내",
    tagsLabel: "서비스 태그",
    tagsHint: "쉼표로 나눠 적습니다. 예: 즉시 예약, 공구 지참",
    noItemsTitle: "아직 등록된 서비스가 없습니다.",
    noItemsDescription:
      "먼저 서비스를 하나 등록하면 이 화면에서 수정과 끄기까지 바로 확인할 수 있습니다.",
    statusLive: "노출 중",
    statusHidden: "숨김",
    createdMessage: "새 서비스가 등록되었습니다.",
    updatedMessage: "서비스 내용이 수정되었습니다.",
    disabledMessage: "서비스를 잠시 숨겼습니다.",
    enabledMessage: "서비스를 다시 노출했습니다.",
    titleError: "서비스 이름은 2글자 이상으로 입력해 주세요.",
    locationError: "지역은 2글자 이상으로 입력해 주세요.",
    priceError: "가격 또는 가격 범위를 알기 쉽게 입력해 주세요.",
    arrivalError: "방문 가능 안내를 짧게라도 입력해 주세요.",
    hiddenHint: "숨김 상태에서는 고객 화면에서 이 서비스가 보이지 않습니다.",
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseTags(tagsText: string) {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeInitialItems(items: ManagedServiceItem[]) {
  return items.map((item) => ({
    ...item,
    isActive: typeof item.isActive === "boolean" ? item.isActive : true,
  }));
}

function getStorageKey(sessionToken: string) {
  return `ayosnow-managed-services:${sessionToken}`;
}

export function MyServicesManager({
  locale,
  sessionToken,
  ownerName,
  initialItems,
}: MyServicesManagerProps) {
  const text = getMyServicesText(locale);
  const normalizedInitialItems = normalizeInitialItems(initialItems);

  const [items, setItems] = useState<ManagedServiceItem[]>(() => {
    if (typeof window === "undefined") {
      return normalizedInitialItems;
    }

    const storedValue = window.localStorage.getItem(getStorageKey(sessionToken));
    if (!storedValue) {
      return normalizedInitialItems;
    }

    try {
      const parsed = JSON.parse(storedValue) as ManagedServiceItem[];
      return normalizeInitialItems(parsed);
    } catch {
      return normalizedInitialItems;
    }
  });
  const [isFormOpen, setIsFormOpen] = useState(normalizedInitialItems.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ServiceFormState>(emptyFormState);
  const [errors, setErrors] = useState<ServiceFormErrors>({});
  const [notice, setNotice] = useState("");

  const persistItems = (nextItems: ManagedServiceItem[]) => {
    setItems(nextItems);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        getStorageKey(sessionToken),
        JSON.stringify(nextItems),
      );
    }
  };

  const resetForm = () => {
    setFormState(emptyFormState);
    setErrors({});
    setEditingId(null);
  };

  const openCreateForm = () => {
    resetForm();
    setNotice("");
    setIsFormOpen(true);
  };

  const openEditForm = (item: ManagedServiceItem) => {
    setFormState({
      title: item.title,
      location: item.location,
      priceLabel: item.priceLabel,
      arrival: item.arrival,
      tagsText: item.tags.join(", "),
    });
    setErrors({});
    setEditingId(item.id);
    setNotice("");
    setIsFormOpen(true);
  };

  const validateForm = (value: ServiceFormState) => {
    const nextErrors: ServiceFormErrors = {};

    if (value.title.trim().length < 2) {
      nextErrors.title = text.titleError;
    }

    if (value.location.trim().length < 2) {
      nextErrors.location = text.locationError;
    }

    if (value.priceLabel.trim().length < 3) {
      nextErrors.priceLabel = text.priceError;
    }

    if (value.arrival.trim().length < 3) {
      nextErrors.arrival = text.arrivalError;
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(formState);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const nextItem: ManagedServiceItem = {
      id: editingId ?? `svc-local-${crypto.randomUUID()}`,
      slug: slugify(formState.title),
      title: formState.title.trim(),
      location: formState.location.trim(),
      priceLabel: formState.priceLabel.trim(),
      arrival: formState.arrival.trim(),
      tags: parseTags(formState.tagsText),
      isActive:
        editingId !== null
          ? items.find((item) => item.id === editingId)?.isActive ?? true
          : true,
    };

    const nextItems =
      editingId === null
        ? [nextItem, ...items]
        : items.map((item) => (item.id === editingId ? nextItem : item));

    persistItems(nextItems);
    setNotice(editingId === null ? text.createdMessage : text.updatedMessage);
    resetForm();
    setIsFormOpen(false);
  };

  const handleToggle = (targetId: string) => {
    let nextNotice = text.disabledMessage;

    const nextItems = items.map((item) => {
      if (item.id !== targetId) {
        return item;
      }

      const toggledItem = {
        ...item,
        isActive: !item.isActive,
      };

      nextNotice = toggledItem.isActive ? text.enabledMessage : text.disabledMessage;
      return toggledItem;
    });

    persistItems(nextItems);
    setNotice(nextNotice);
  };

  const sortedItems = [...items].sort((left, right) => {
    if (left.isActive === right.isActive) {
      return left.title.localeCompare(right.title);
    }

    return left.isActive ? -1 : 1;
  });

  return (
    <section className="space-y-4">
      <div className="panel-shell p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-lg font-bold text-slate-950">{text.panelTitle}</p>
            <p className="text-sm text-slate-600">{text.panelDescription}</p>
            <p className="text-xs text-slate-500">
              {ownerName} · {text.browserSaveNotice}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            {text.addAction}
          </button>
        </div>
      </div>

      {notice ? (
        <div className="rounded-3xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          {notice}
        </div>
      ) : null}

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="panel-shell grid gap-4 p-5">
          <div className="space-y-1">
            <p className="text-lg font-bold text-slate-950">
              {editingId === null ? text.createTitle : text.editTitle}
            </p>
            <p className="text-sm text-slate-600">
              {locale === "ko"
                ? "고객 화면에 보여 줄 서비스 정보를 여기서 바로 바꿉니다."
                : locale === "fil"
                  ? "Dito agad ina-update ang impormasyong makikita ng customer."
                  : "Update the service details that customers will see on this page."}
            </p>
          </div>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{text.titleLabel}</span>
            <input
              value={formState.title}
              onChange={(event) => {
                setFormState((current) => ({ ...current, title: event.target.value }));
                setErrors((current) => ({ ...current, title: undefined }));
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
            />
            {errors.title ? <p className="text-xs text-rose-600">{errors.title}</p> : null}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>{text.locationLabel}</span>
              <input
                value={formState.location}
                onChange={(event) => {
                  setFormState((current) => ({
                    ...current,
                    location: event.target.value,
                  }));
                  setErrors((current) => ({ ...current, location: undefined }));
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              {errors.location ? (
                <p className="text-xs text-rose-600">{errors.location}</p>
              ) : null}
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>{text.priceLabel}</span>
              <input
                value={formState.priceLabel}
                onChange={(event) => {
                  setFormState((current) => ({
                    ...current,
                    priceLabel: event.target.value,
                  }));
                  setErrors((current) => ({ ...current, priceLabel: undefined }));
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              {errors.priceLabel ? (
                <p className="text-xs text-rose-600">{errors.priceLabel}</p>
              ) : null}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>{text.arrivalLabel}</span>
              <input
                value={formState.arrival}
                onChange={(event) => {
                  setFormState((current) => ({
                    ...current,
                    arrival: event.target.value,
                  }));
                  setErrors((current) => ({ ...current, arrival: undefined }));
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              {errors.arrival ? (
                <p className="text-xs text-rose-600">{errors.arrival}</p>
              ) : null}
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>{text.tagsLabel}</span>
              <input
                value={formState.tagsText}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    tagsText: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              <p className="text-xs text-slate-500">{text.tagsHint}</p>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              {editingId === null ? text.createAction : text.updateAction}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsFormOpen(false);
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {text.cancelAction}
            </button>
          </div>
        </form>
      ) : null}

      {sortedItems.length === 0 ? (
        <div className="panel-shell p-6 text-center">
          <p className="text-lg font-bold text-slate-950">{text.noItemsTitle}</p>
          <p className="mt-2 text-sm text-slate-600">{text.noItemsDescription}</p>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {sortedItems.map((item) => (
            <article
              key={item.id}
              className={`panel-shell p-5 transition ${
                item.isActive ? "" : "opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-bold text-slate-950">{item.title}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isActive
                          ? "bg-teal-100 text-teal-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.isActive ? text.statusLive : text.statusHidden}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {item.location} · {item.priceLabel}
                  </p>
                  <p className="text-sm text-slate-500">{item.arrival}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(item)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {text.editAction}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className="rounded-full border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700"
                  >
                    {item.isActive ? text.disableAction : text.enableAction}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>

              {!item.isActive ? (
                <p className="mt-4 text-xs font-medium text-slate-500">{text.hiddenHint}</p>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
