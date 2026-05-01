import { copy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface SiteFooterProps {
  locale: Locale;
}

export function SiteFooter({ locale }: SiteFooterProps) {
  const text = copy[locale];

  return (
    <footer className="border-t border-slate-200/80 bg-white/70">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-slate-600 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-teal-700">
            {text.siteTagline}
          </p>
          <p className="mb-2 text-base font-bold text-slate-950">{text.siteName}</p>
          <p>{text.footerIntro}</p>
        </div>
        <div>
          <p className="mb-2 text-base font-bold text-slate-950">{text.footerFlowTitle}</p>
          <p>{text.footerFlowText}</p>
        </div>
        <div>
          <p className="mb-2 text-base font-bold text-slate-950">{text.footerOpsTitle}</p>
          <p>{text.footerOpsText}</p>
        </div>
      </div>
    </footer>
  );
}
