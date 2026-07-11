"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { ProfessionalBadgeSettingsSnapshot } from "@/lib/professional-badges/professional-badge-rules";

interface BadgeHistoryItem {
  id: string;
  professionalName: string;
  email: string;
  code: string;
  action: string;
  reason: string | null;
  createdAt: string;
}

interface BadgeProfileOption {
  profileId: string;
  fullName: string;
}

interface AdminProfessionalBadgePanelProps {
  initialSettings: ProfessionalBadgeSettingsSnapshot;
  profiles: BadgeProfileOption[];
  history: BadgeHistoryItem[];
}

export function AdminProfessionalBadgePanel({
  initialSettings,
  profiles,
  history,
}: AdminProfessionalBadgePanelProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [removeProfileId, setRemoveProfileId] = useState(profiles[0]?.profileId ?? "");
  const [removeCode, setRemoveCode] = useState<"VERIFIED_PROFESSIONAL" | "TOP_PROFESSIONAL">(
    "TOP_PROFESSIONAL",
  );
  const [removeReason, setRemoveReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateNumber<K extends keyof ProfessionalBadgeSettingsSnapshot>(
    key: K,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      [key]: Number(value),
    }));
  }

  function saveSettings() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/professional-badges/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = (await response.json().catch(() => null)) as { error?: unknown } | null;

      if (!response.ok) {
        setError(typeof result?.error === "string" ? result.error : "Could not save badge settings.");
        return;
      }

      setMessage("Professional badge settings saved.");
      router.refresh();
    });
  }

  function removeBadge() {
    setMessage(null);
    setError(null);

    if (!removeProfileId) {
      setError("Choose a professional first.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/professional-badges/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: removeProfileId,
          code: removeCode,
          reason: removeReason,
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: unknown } | null;

      if (!response.ok) {
        setError(typeof result?.error === "string" ? result.error : "Could not remove this badge.");
        return;
      }

      setRemoveReason("");
      setMessage("Professional badge was removed.");
      router.refresh();
    });
  }

  return (
    <article id="professional-badges" className="scroll-mt-28 panel-shell p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Professional badges</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Configure trust badges, Top Professional thresholds, manual removals, and badge history.
          </p>
        </div>
        <span className="chip">Trust system</span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="font-black text-slate-950">Badge settings</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["badgesEnabled", "Enable badges"],
              ["verifiedBadgeEnabled", "Verified badge"],
              ["topBadgeEnabled", "Top badge"],
            ].map(([key, label]) => (
              <label key={key} className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(settings[key as keyof ProfessionalBadgeSettingsSnapshot])}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-800">
              Minimum completed bookings
              <input
                type="number"
                min="0"
                value={settings.topMinCompletedBookings}
                onChange={(event) => updateNumber("topMinCompletedBookings", event.target.value)}
                className="mobile-field mt-2"
              />
            </label>
            <label className="text-sm font-bold text-slate-800">
              Minimum average rating
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={settings.topMinAverageRating}
                onChange={(event) => updateNumber("topMinAverageRating", event.target.value)}
                className="mobile-field mt-2"
              />
            </label>
            <label className="text-sm font-bold text-slate-800">
              Minimum response rate %
              <input
                type="number"
                min="0"
                max="100"
                value={settings.topMinResponseRate}
                onChange={(event) => updateNumber("topMinResponseRate", event.target.value)}
                className="mobile-field mt-2"
              />
            </label>
            <label className="text-sm font-bold text-slate-800">
              Maximum cancellation rate %
              <input
                type="number"
                min="0"
                max="100"
                value={settings.topMaxCancellationRate}
                onChange={(event) => updateNumber("topMaxCancellationRate", event.target.value)}
                className="mobile-field mt-2"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={isPending}
            className="mt-4 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-teal-800 active:scale-[0.99] disabled:bg-slate-400"
          >
            {isPending ? "Saving..." : "Save badge settings"}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4">
          <h3 className="font-black text-slate-950">Manual badge removal</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this when a badge must be removed before automatic rules catch up.
          </p>
          <div className="mt-4 grid gap-3">
            <select
              value={removeProfileId}
              onChange={(event) => setRemoveProfileId(event.target.value)}
              className="mobile-field"
            >
              {profiles.map((profile) => (
                <option key={profile.profileId} value={profile.profileId}>
                  {profile.fullName}
                </option>
              ))}
            </select>
            <select
              value={removeCode}
              onChange={(event) =>
                setRemoveCode(event.target.value as "VERIFIED_PROFESSIONAL" | "TOP_PROFESSIONAL")
              }
              className="mobile-field"
            >
              <option value="VERIFIED_PROFESSIONAL">Verified Professional</option>
              <option value="TOP_PROFESSIONAL">Top Professional</option>
            </select>
            <textarea
              value={removeReason}
              onChange={(event) => setRemoveReason(event.target.value)}
              placeholder="Reason for removal"
              className="mobile-field min-h-24"
            />
            <button
              type="button"
              onClick={removeBadge}
              disabled={isPending}
              className="rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-black text-rose-700 transition hover:bg-rose-50 active:scale-[0.99] disabled:opacity-60"
            >
              Remove badge
            </button>
          </div>
        </section>
      </div>

      {error ? <p className="mt-4 text-sm font-bold text-rose-700">{error}</p> : null}
      {message ? <p className="mt-4 text-sm font-bold text-teal-700">{message}</p> : null}

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
        <h3 className="font-black text-slate-950">Badge history</h3>
        <div className="mt-4 grid gap-3">
          {history.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No badge history yet.
            </p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{item.professionalName}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.email}</p>
                  </div>
                  <span className="chip">{item.action}</span>
                </div>
                <p className="mt-2">
                  {item.code.replace(/_/g, " ")}
                  {item.reason ? ` · ${item.reason}` : ""}
                </p>
                <p className="mt-2 text-xs text-slate-500">{item.createdAt}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  );
}
