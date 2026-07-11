"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type VideoUrls = [string, string, string];

interface AdminPromotionalVideoManagerProps {
  initialVideoUrls: VideoUrls;
}

type ApiError =
  | string
  | {
      fieldErrors?: {
        videoUrls?: string[];
      };
      formErrors?: string[];
    };

function getApiErrorMessage(error: ApiError | undefined) {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.fieldErrors?.videoUrls?.[0] ??
    error?.formErrors?.[0] ??
    "Could not save the promotional video links."
  );
}

export function AdminPromotionalVideoManager({
  initialVideoUrls,
}: AdminPromotionalVideoManagerProps) {
  const [videoUrls, setVideoUrls] = useState<VideoUrls>(initialVideoUrls);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const [isSaving, startSaving] = useTransition();

  function updateVideoUrl(index: number, value: string) {
    setVideoUrls((current) => {
      const next: VideoUrls = [...current];
      next[index] = value;
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    startSaving(async () => {
      const response = await fetch("/api/admin/promotional-videos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrls: videoUrls.map((url) => url.trim()),
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            settings?: { videoUrls: VideoUrls };
            error?: ApiError;
          }
        | null;

      if (!response.ok || !result?.settings) {
        setNoticeTone("error");
        setNotice(getApiErrorMessage(result?.error));
        return;
      }

      setVideoUrls(result.settings.videoUrls);
      setNoticeTone("success");
      setNotice("Promotional video links saved. The public page is updated now.");
    });
  }

  return (
    <section className="panel-shell p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
            Promotional video links
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add up to three YouTube links. Leave a field empty to hide that video card from the public page.
          </p>
        </div>
        <Link
          href="/promotional-videos"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        >
          View public page
        </Link>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        {videoUrls.map((url, index) => (
          <label
            key={index}
            className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-black text-slate-800"
          >
            Video {index + 1} URL
            <input
              type="url"
              value={url}
              onChange={(event) => updateVideoUrl(index, event.target.value)}
              maxLength={500}
              inputMode="url"
              autoComplete="off"
              placeholder="https://www.youtube.com/watch?v=..."
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
            <span className="text-xs font-medium leading-5 text-slate-500">
              YouTube watch, share, Shorts, and embed links are supported.
            </span>
          </label>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-teal-700 px-6 text-sm font-black !text-white shadow-[0_16px_28px_-20px_rgba(15,118,110,0.8)] transition hover:bg-teal-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          >
            {isSaving ? "Saving..." : "Save video links"}
          </button>
          <p
            aria-live="polite"
            className={`text-sm font-bold ${
              noticeTone === "error" ? "text-rose-700" : "text-teal-700"
            }`}
          >
            {notice}
          </p>
        </div>
      </form>
    </section>
  );
}
