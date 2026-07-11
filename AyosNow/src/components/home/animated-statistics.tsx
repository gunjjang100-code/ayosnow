"use client";

import { useEffect, useState } from "react";

interface AnimatedStatisticItem {
  label: string;
  value: number;
  suffix?: string;
  helper: string;
}

interface AnimatedStatisticsProps {
  items: AnimatedStatisticItem[];
}

export function AnimatedStatistics({ items }: AnimatedStatisticsProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const maxFrames = 36;
    const timer = window.setInterval(() => {
      frame += 1;
      setProgress(Math.min(frame / maxFrames, 1));

      if (frame >= maxFrames) {
        window.clearInterval(timer);
      }
    }, 24);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const value = Math.round(item.value * progress);

        return (
          <article key={item.label} className="panel-shell p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {value.toLocaleString("en-PH")}
              {item.suffix ?? ""}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.helper}</p>
          </article>
        );
      })}
    </section>
  );
}
