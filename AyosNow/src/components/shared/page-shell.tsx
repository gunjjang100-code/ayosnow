import type { ReactNode } from "react";

interface PageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: PageShellProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pb-28 pt-4 sm:px-6 md:gap-6 md:py-6 lg:px-8">
      <section className="glass-card overflow-hidden">
        <div className="grid gap-3 p-4 md:gap-4 md:p-8 lg:gap-5 lg:p-10">
          <span className="eyebrow-pill w-fit">{eyebrow}</span>
          <h1 className="section-title max-w-3xl">{title}</h1>
          <p className="section-copy max-w-3xl">{description}</p>
        </div>
      </section>
      {children}
    </div>
  );
}
