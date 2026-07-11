import type { ReactNode } from "react";

interface InfoCardProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function InfoCard({ title, description, children }: InfoCardProps) {
  return (
    <article className="panel-shell overflow-hidden">
      <div className="border-b border-slate-200/80 px-4 py-4 md:px-5 md:py-5">
        <h2 className="text-xl font-black leading-tight text-slate-950">{title}</h2>
        <p className="mt-2 text-[15px] leading-7 text-slate-600">{description}</p>
      </div>
      {children ? <div className="px-4 py-4 md:px-5 md:py-5">{children}</div> : null}
    </article>
  );
}
