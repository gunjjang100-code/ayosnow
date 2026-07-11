"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Locale } from "@/lib/types";

interface BookingReviewFormProps {
  bookingId: string;
  locale: Locale;
  canReview: boolean;
  existingReview: {
    rating: number;
    comment: string;
    photoUrl: string | null;
  } | null;
}

const reviewCopy = {
  fil: {
    title: "Review",
    description: "Pagkatapos makumpleto ang trabaho, isang beses lang makakapag-iwan ng review ang customer.",
    locked: "Customer lang ng completed booking ang puwedeng mag-review.",
    existing: "May review ka na para sa booking na ito.",
    rating: "Rating",
    comment: "Review",
    commentPlaceholder: "Ilagay kung kumusta ang quality, oras, at pakikipag-usap.",
    photoUrl: "Photo URL",
    photoHint: "Optional. Ilagay kung may work photo URL.",
    submit: "Save Review",
    pending: "Saving...",
    success: "Saved ang review.",
    error: "Hindi na-save ang review.",
  },
  en: {
    title: "Review",
    description: "After the work is complete, the customer can leave one review for this booking.",
    locked: "Only the customer can review a completed booking.",
    existing: "You already reviewed this booking.",
    rating: "Rating",
    comment: "Review",
    commentPlaceholder: "Share how the quality, timing, and communication went.",
    photoUrl: "Photo URL",
    photoHint: "Optional. Add a work photo URL if you have one.",
    submit: "Save Review",
    pending: "Saving...",
    success: "Review saved.",
    error: "Could not save the review.",
  },
} satisfies Record<Locale, Record<string, string>>;

export function BookingReviewForm({
  bookingId,
  locale,
  canReview,
  existingReview,
}: BookingReviewFormProps) {
  const router = useRouter();
  const publicLocale = locale === "fil" ? "fil" : "en";
  const text = reviewCopy[publicLocale];
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [photoUrl, setPhotoUrl] = useState(existingReview?.photoUrl ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment,
          photoUrl,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: unknown }
        | null;

      if (!response.ok) {
        setFeedback(typeof result?.error === "string" ? result.error : text.error);
        return;
      }

      setFeedback(text.success);
      router.refresh();
    });
  }

  return (
    <article className="soft-card p-5">
      <p className="text-sm font-bold text-teal-700">{text.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text.description}</p>

      {existingReview ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900">{text.existing}</p>
          <p className="mt-2 text-sm text-emerald-800">
            {text.rating}: {existingReview.rating} / 5
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{existingReview.comment}</p>
        </div>
      ) : canReview ? (
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">{text.rating}</span>
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              {[5, 4, 3, 2, 1].map((score) => (
                <option key={score} value={score}>
                  {score} / 5
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">{text.comment}</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={text.commentPlaceholder}
              rows={5}
              className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">{text.photoUrl}</span>
            <input
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="https://..."
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            />
            <span className="text-xs text-slate-500">{text.photoHint}</span>
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || comment.trim().length < 10}
            className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? text.pending : text.submit}
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {text.locked}
        </div>
      )}

      {feedback ? <p className="mt-4 text-sm font-medium text-teal-700">{feedback}</p> : null}
    </article>
  );
}
