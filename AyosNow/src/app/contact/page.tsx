import type { Metadata } from "next";

import { contactEmails } from "@/lib/legal";

const appUrl = (process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://puntago.net").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Contact | PuntaGo",
  description: "Contact PuntaGo support, privacy, business, and abuse reporting teams.",
  alternates: {
    canonical: `${appUrl}/contact`,
  },
  openGraph: {
    title: "Contact | PuntaGo",
    description: "Contact PuntaGo support, privacy, business, and abuse reporting teams.",
    url: `${appUrl}/contact`,
    siteName: "PuntaGo",
    type: "website",
  },
};

const contactCards = [
  {
    label: "Support Email",
    description: "Account help, booking questions, wallet concerns, and general support.",
    email: contactEmails.supportEmail,
  },
  {
    label: "Privacy",
    description: "Privacy rights, account deletion requests, and data protection questions.",
    email: contactEmails.privacyEmail,
  },
  {
    label: "Business",
    description: "Partnerships, professional onboarding, and commercial inquiries.",
    email: contactEmails.businessEmail,
  },
  {
    label: "Abuse Reports",
    description: "Safety issues, fraud, harassment, harmful content, or policy violations.",
    email: contactEmails.abuseEmail,
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-8">
      <section className="glass-card overflow-hidden">
        <div className="border-b border-slate-200/80 px-5 py-7 sm:px-8 md:py-10">
          <span className="eyebrow-pill">PuntaGo Contact</span>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Contact PuntaGo
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Choose the best inbox for your request. These addresses are placeholders and can be
            updated from the central contact configuration when the production support process is
            finalized.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-7 sm:px-8 md:grid-cols-2 md:py-10">
          {contactCards.map((card) => (
            <article key={card.label} className="panel-shell p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
                {card.label}
              </p>
              <a
                href={`mailto:${card.email}`}
                className="mt-3 block text-xl font-black text-slate-950 transition hover:text-teal-700"
              >
                {card.email}
              </a>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
