interface StatCardProps {
  label: string;
  value: string;
  helper: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="panel-shell p-4 md:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black leading-tight text-slate-950 md:text-3xl">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>
    </article>
  );
}
