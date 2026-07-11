"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { ReviewPreview } from "@/lib/types";

interface ReviewCarouselProps {
  reviews: ReviewPreview[];
  emptyLabel: string;
}

export function ReviewCarousel({ reviews, emptyLabel }: ReviewCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % reviews.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [reviews.length]);

  if (reviews.length === 0) {
    return (
      <div className="panel-shell p-6">
        <p className="text-sm leading-6 text-slate-600">{emptyLabel}</p>
      </div>
    );
  }

  const activeReview = reviews[activeIndex];

  return (
    <div className="panel-shell overflow-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
            Real reviews
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Service experiences from customers
          </h2>
        </div>
        <span className="chip">★ {activeReview.rating}</span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[96px_1fr] md:items-start">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-slate-950 text-2xl font-black text-white">
          {activeReview.photoUrl ? (
            <Image
              src={activeReview.photoUrl}
              alt={activeReview.author}
              width={96}
              height={96}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            activeReview.author.slice(0, 1)
          )}
        </div>
        <div>
          <p className="text-lg font-bold leading-8 text-slate-950">
            “{activeReview.comment}”
          </p>
          <p className="mt-4 text-sm font-bold text-slate-800">{activeReview.author}</p>
          <p className="mt-1 text-sm text-slate-500">
            {activeReview.targetName ? `${activeReview.targetName} professional` : "PuntaGo customer"}
            {activeReview.location ? ` · ${activeReview.location}` : ""}
          </p>
        </div>
      </div>

      {reviews.length > 1 ? (
        <div className="mt-5 flex gap-2" aria-label="Select review slide">
          {reviews.map((review, index) => (
            <button
              key={review.id}
              type="button"
              aria-label={`View review ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition ${
                index === activeIndex ? "w-8 bg-slate-950" : "w-2.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
