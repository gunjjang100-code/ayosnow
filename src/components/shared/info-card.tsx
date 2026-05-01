import type { ReactNode } from "react";

interface InfoCardProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function InfoCard({ title, description, children }: InfoCardProps) {
  return (
    <article className="panel-shell overflow-hidden">
      <div className="border-b border-slate-200/80 px-5 py-5">
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children ? <div className="px-5 py-5">{children}</div> : null}
    </article>
  );
}
