"use client";

import { useState } from "react";

import type { Locale, TradesmanAvailabilityItem } from "@/lib/types";

interface TradesmanAvailabilityEditorProps {
  locale: Locale;
  initialItems: TradesmanAvailabilityItem[];
}

interface AvailabilityText {
  panelTitle: string;
  panelDescription: string;
  availableLabel: string;
  unavailableLabel: string;
  startLabel: string;
  endLabel: string;
  saveAction: string;
  savingAction: string;
  savedMessage: string;
  errorMessage: string;
  timeError: string;
}

function getAvailabilityText(locale: Locale): AvailabilityText {
  if (locale === "fil") {
    return {
      panelTitle: "I-set ang oras na puwedeng piliin ng customer",
      panelDescription:
        "I-on ang araw na tumatanggap ka ng booking at piliin ang oras ng trabaho.",
      availableLabel: "Tumatanggap",
      unavailableLabel: "Sarado",
      startLabel: "Simula",
      endLabel: "Tapos",
      saveAction: "I-save ang availability",
      savingAction: "Sine-save...",
      savedMessage: "Na-save ang availability.",
      errorMessage: "Hindi na-save ang availability. Pakisubukan ulit.",
      timeError: "Dapat mas huli ang tapos na oras kaysa simula.",
    };
  }

  return {
    panelTitle: "Set the hours customers can book",
    panelDescription:
      "Turn on the days you accept bookings and choose your working hours.",
    availableLabel: "Available",
    unavailableLabel: "Closed",
    startLabel: "Start",
    endLabel: "End",
    saveAction: "Save availability",
    savingAction: "Saving...",
    savedMessage: "Availability saved.",
    errorMessage: "Could not save availability. Please try again.",
    timeError: "End time must be later than start time.",
  };
}

function minutesFromTime(value: string) {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function hasInvalidTimeRange(items: TradesmanAvailabilityItem[]) {
  return items.some(
    (item) =>
      item.isAvailable && minutesFromTime(item.startTime) >= minutesFromTime(item.endTime),
  );
}

export function TradesmanAvailabilityEditor({
  locale,
  initialItems,
}: TradesmanAvailabilityEditorProps) {
  const text = getAvailabilityText(locale);
  const [items, setItems] = useState(initialItems);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateItem = (
    dayOfWeek: number,
    patch: Partial<TradesmanAvailabilityItem>,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item,
      ),
    );
    setNotice("");
    setError("");
  };

  const saveAvailability = async () => {
    if (hasInvalidTimeRange(items)) {
      setNotice("");
      setError(text.timeError);
      return;
    }

    setIsSaving(true);
    setNotice("");
    setError("");

    const response = await fetch("/api/tradesman-availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        availability: items.map((item) => ({
          dayOfWeek: item.dayOfWeek,
          isAvailable: item.isAvailable,
          startTime: item.startTime,
          endTime: item.endTime,
        })),
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      availability?: TradesmanAvailabilityItem[];
      error?: string;
    } | null;

    setIsSaving(false);

    if (!response.ok || !payload?.availability) {
      setError(payload?.error ?? text.errorMessage);
      return;
    }

    setItems(payload.availability);
    setNotice(text.savedMessage);
  };

  return (
    <section className="panel-shell p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{text.panelTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {text.panelDescription}
          </p>
        </div>
        <button
          type="button"
          onClick={saveAvailability}
          disabled={isSaving}
          className="min-h-12 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? text.savingAction : text.saveAction}
        </button>
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.dayOfWeek}
            className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-950">{item.dayLabel}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.isAvailable ? text.availableLabel : text.unavailableLabel}
                </p>
              </div>
              <button
                type="button"
                aria-pressed={item.isAvailable}
                onClick={() =>
                  updateItem(item.dayOfWeek, { isAvailable: !item.isAvailable })
                }
                className={`min-h-11 rounded-full px-4 text-sm font-bold transition active:scale-[0.96] ${
                  item.isAvailable
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {item.isAvailable ? text.availableLabel : text.unavailableLabel}
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                {text.startLabel}
                <input
                  type="time"
                  value={item.startTime}
                  disabled={!item.isAvailable}
                  onChange={(event) =>
                    updateItem(item.dayOfWeek, { startTime: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                {text.endLabel}
                <input
                  type="time"
                  value={item.endTime}
                  disabled={!item.isAvailable}
                  onChange={(event) =>
                    updateItem(item.dayOfWeek, { endTime: event.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
