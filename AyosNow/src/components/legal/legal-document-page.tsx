import Link from "next/link";

import { legalLastUpdated, type LegalDocument } from "@/lib/legal";
import { legalLinks } from "@/lib/legal-shared";

interface LegalDocumentPageProps {
  document: LegalDocument;
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-28 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="panel-shell p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
            Legal
          </p>
          <h2 className="mt-2 text-lg font-black text-slate-950">Table of Contents</h2>
          <nav className="mt-4 grid gap-2" aria-label={`${document.title} sections`}>
            {document.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <article className="glass-card overflow-hidden">
        <header className="border-b border-slate-200/80 px-5 py-7 sm:px-8 md:py-10">
          <span className="eyebrow-pill">PuntaGo Legal</span>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {document.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            {document.description}
          </p>
          <p className="mt-5 text-sm font-bold text-slate-500">
            Last Updated: {legalLastUpdated}
          </p>
        </header>

        <div className="grid gap-8 px-5 py-7 sm:px-8 md:py-10">
          {document.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-32 border-b border-slate-200/80 pb-8 last:border-b-0 last:pb-0"
            >
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                {section.title}
              </h2>
              <div className="mt-4 grid gap-4 text-[15px] leading-7 text-slate-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-slate-200/80 bg-slate-50 px-5 py-6 sm:px-8">
          <p className="text-sm font-bold text-slate-950">Related policies</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </footer>
      </article>
    </div>
  );
}
