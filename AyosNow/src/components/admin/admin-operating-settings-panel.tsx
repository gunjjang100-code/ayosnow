"use client";

import { useState, useTransition } from "react";

interface AdminOperatingSettingsPanelProps {
  initialReferral: {
    rewardCredits: number;
    isActive: boolean;
  };
  banners: {
    total: number;
    active: number;
  };
  emergency: {
    featuredCategoryCount: number;
  };
  ranking: {
    id: string;
    name: string;
    displayOrder: number;
    featured: boolean;
  }[];
}

export function AdminOperatingSettingsPanel({
  initialReferral,
  banners,
  emergency,
  ranking,
}: AdminOperatingSettingsPanelProps) {
  const [rewardCredits, setRewardCredits] = useState(String(initialReferral.rewardCredits));
  const [isActive, setIsActive] = useState(initialReferral.isActive);
  const [notice, setNotice] = useState("");
  const [isSaving, startSaving] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    const numericReward = Number(rewardCredits);
    if (!Number.isInteger(numericReward) || numericReward < 0 || numericReward > 10000) {
      setNotice("Referral reward must be an integer from 0 to 10000.");
      return;
    }

    startSaving(async () => {
      const response = await fetch("/api/admin/referral-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rewardCredits: numericReward,
          isActive,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { setting?: { rewardCredits: number; isActive: boolean }; error?: string }
        | null;

      if (!response.ok || !result?.setting) {
        setNotice(result?.error ?? "Could not save referral reward settings.");
        return;
      }

      setRewardCredits(String(result.setting.rewardCredits));
      setIsActive(result.setting.isActive);
      setNotice("Referral reward settings saved.");
    });
  }

  return (
    <section className="panel-shell p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Operating settings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review professional referral rewards, banner status, emergency exposure, and service ranking in one place.
          </p>
        </div>
        <span className="chip">Pre-launch</span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold text-slate-950">Professional referral reward</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Quote credits recorded when a professional invites another professional with a referral code.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Enabled
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold text-slate-800">
            Quote credits per professional signup
            <input
              value={rewardCredits}
              onChange={(event) => setRewardCredits(event.target.value)}
              inputMode="numeric"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-300"
            />
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className="mt-4 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save professional referral reward"}
          </button>
          {notice ? (
            <p className="mt-3 text-sm font-semibold text-teal-700">{notice}</p>
          ) : null}
        </form>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Banners
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {banners.active}/{banners.total}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Active banners / total banners.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Emergency
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {emergency.featuredCategoryCount}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Number of emergency/featured categories.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Ranking
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {ranking.length}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Top items by display order.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {ranking.map((item, index) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="font-bold text-slate-950">
                {index + 1}. {item.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">Display order {item.displayOrder}</p>
            </div>
            {item.featured ? <span className="chip">Featured</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
