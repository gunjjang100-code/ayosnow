import Link from "next/link";

import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";

export default async function NotFound() {
  const locale = await getCurrentLocale();
  const text = copy[locale];

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-teal-700">404</p>
      <h1 className="section-title">{text.notFoundTitle}</h1>
      <p className="section-copy max-w-xl">{text.notFoundDescription}</p>
      <Link
        href="/"
        className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
      >
        {text.notFoundButton}
      </Link>
    </div>
  );
}
