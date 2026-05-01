import { formatPhp } from "@/lib/utils";

export interface AdminStatCard {
  label: string;
  value: number;
  helper: string;
  tone: "green" | "blue" | "orange" | "red";
  format?: "number" | "money";
}

const toneClasses: Record<AdminStatCard["tone"], string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  blue: "border-sky-200 bg-sky-50 text-sky-900",
  orange: "border-orange-200 bg-orange-50 text-orange-900",
  red: "border-rose-200 bg-rose-50 text-rose-900",
};

export function StatCards({ cards }: { cards: AdminStatCard[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`rounded-3xl border p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] ${toneClasses[card.tone]}`}
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
            {card.label}
          </p>
          <p className="mt-4 text-3xl font-black">
            {card.format === "money" ? formatPhp(card.value) : card.value.toLocaleString("en-PH")}
          </p>
          <p className="mt-3 text-sm leading-6 opacity-80">{card.helper}</p>
        </article>
      ))}
    </section>
  );
}
