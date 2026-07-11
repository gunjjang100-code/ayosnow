import Link from "next/link";

import { copy } from "@/lib/i18n";
import { legalLinks } from "@/lib/legal-shared";
import type { Locale } from "@/lib/types";

interface SiteFooterProps {
  locale: Locale;
}

export function SiteFooter({ locale }: SiteFooterProps) {
  const publicLocale = locale === "fil" ? "fil" : "en";
  const text = copy[publicLocale];
  const legalLabels =
    publicLocale === "fil"
        ? {
            terms: "Terms of Service",
            privacy: "Privacy Policy",
            "payment-refund": "Payment & Refund Policy",
            "pro-policy": "Professional Policy",
            "community-guidelines": "Community Guidelines",
            "cookie-policy": "Cookie Policy",
            contact: "Contact",
          }
        : null;
  const footerCopy =
    publicLocale === "en"
      ? {
          company: "Company",
          services: "Services",
          support: "Support",
          legal: "Legal",
          downloadApp: "Download App",
          getItOn: "Get it on",
          companyLinks: [
            { label: "How It Works", href: "/how-it-works" },
            { label: "Promotional Videos", href: "/promotional-videos" },
            { label: "Professionals", href: "/#professionals" },
            { label: "About", href: "/#about" },
          ],
          serviceLinks: [
            { label: "Services", href: "/services" },
            { label: "Categories", href: "/categories" },
            { label: "Request Quote", href: "/quote-request" },
          ],
          supportLinks: [
            { label: "Contact", href: "/contact" },
            { label: "Chat", href: "/chat" },
            { label: "Bookings", href: "/bookings" },
          ],
        }
      : publicLocale === "fil"
        ? {
            company: "Company",
            services: "Services",
            support: "Support",
            legal: "Legal",
            downloadApp: "Download App",
            getItOn: "Get it on",
            companyLinks: [
              { label: "Paano Gumagana", href: "/how-it-works" },
              { label: "Mga Promotional Video", href: "/promotional-videos" },
              { label: "Professionals", href: "/#professionals" },
              { label: "About", href: "/#about" },
            ],
            serviceLinks: [
              { label: "Services", href: "/services" },
              { label: "Categories", href: "/categories" },
              { label: "Request Quote", href: "/quote-request" },
            ],
            supportLinks: [
              { label: "Contact", href: "/contact" },
              { label: "Chat", href: "/chat" },
              { label: "Bookings", href: "/bookings" },
            ],
          }
        : {
            company: "Company",
            services: "Services",
            support: "Support",
            legal: "Legal",
            downloadApp: "Download App",
            getItOn: "Get it on",
            companyLinks: [
              { label: "How It Works", href: "/how-it-works" },
              { label: "Promotional Videos", href: "/promotional-videos" },
              { label: "Professionals", href: "/#professionals" },
              { label: "About", href: "/#about" },
            ],
            serviceLinks: [
              { label: "Services", href: "/services" },
              { label: "Categories", href: "/categories" },
              { label: "Request Quote", href: "/quote-request" },
            ],
            supportLinks: [
              { label: "Contact", href: "/contact" },
              { label: "Chat", href: "/chat" },
              { label: "Bookings", href: "/bookings" },
            ],
          };

  return (
    <footer id="about" className="border-t border-slate-100 bg-white pb-24 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-9 text-sm text-slate-600 sm:px-6 md:grid-cols-2 md:gap-9 md:py-14 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] lg:px-8">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-teal-700">
            {text.siteTagline}
          </p>
          <p className="mb-3 text-xl font-black text-slate-950">{text.siteName}</p>
          <p className="max-w-xs leading-7">{text.footerIntro}</p>
        </div>
        <details className="group rounded-2xl border border-slate-100 p-3.5 md:block md:border-0 md:p-0" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-base font-black text-slate-950 md:mb-4 md:block [&::-webkit-details-marker]:hidden">
            {footerCopy.company}
            <span className="text-slate-400 group-open:hidden md:hidden">+</span>
            <span className="hidden text-slate-400 group-open:inline md:hidden">−</span>
          </summary>
          <nav className="mt-4 grid gap-3 md:mt-0" aria-label="Company links">
            {footerCopy.companyLinks.map((link) => (
              <Link key={link.href} href={link.href} className="font-semibold transition hover:text-teal-700">
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
        <details className="group rounded-2xl border border-slate-100 p-3.5 md:block md:border-0 md:p-0" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-base font-black text-slate-950 md:mb-4 md:block [&::-webkit-details-marker]:hidden">
            {footerCopy.services}
            <span className="text-slate-400 group-open:hidden md:hidden">+</span>
            <span className="hidden text-slate-400 group-open:inline md:hidden">−</span>
          </summary>
          <nav className="mt-4 grid gap-3 md:mt-0" aria-label="Service links">
            {footerCopy.serviceLinks.map((link) => (
              <Link key={link.href} href={link.href} className="font-semibold transition hover:text-teal-700">
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
        <details className="group rounded-2xl border border-slate-100 p-3.5 md:block md:border-0 md:p-0" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-base font-black text-slate-950 md:mb-4 md:block [&::-webkit-details-marker]:hidden">
            {footerCopy.support}
            <span className="text-slate-400 group-open:hidden md:hidden">+</span>
            <span className="hidden text-slate-400 group-open:inline md:hidden">−</span>
          </summary>
          <nav className="mt-4 grid gap-3 md:mt-0" aria-label="Support links">
            {footerCopy.supportLinks.map((link) => (
              <Link key={link.href} href={link.href} className="font-semibold transition hover:text-teal-700">
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
        <div className="rounded-2xl border border-slate-100 p-3.5 md:border-0 md:p-0">
          <p className="mb-4 text-base font-black text-slate-950">{footerCopy.legal}</p>
          <nav className="grid grid-cols-2 gap-3 md:grid-cols-1" aria-label="Legal links">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-slate-600 transition hover:text-teal-700 md:text-sm"
              >
                {legalLabels?.[link.slug] ?? link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8">
            <p className="mb-3 text-base font-black text-slate-950">{footerCopy.downloadApp}</p>
            <div className="grid gap-2">
              {["Google Play", "App Store"].map((store) => (
                <div key={store} className="flex min-h-12 items-center gap-3 rounded-2xl bg-slate-950 px-4 text-white">
                  <span className="text-base">▶</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-white/60">{footerCopy.getItOn}</p>
                    <p className="text-sm font-black">{store}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
