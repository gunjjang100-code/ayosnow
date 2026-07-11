import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/types";

type GuideCopy = {
  eyebrow: string;
  title: string;
  description: string;
  customerJump: string;
  professionalJump: string;
  creditJump: string;
  customer: {
    eyebrow: string;
    title: string;
    description: string;
    freeTitle: string;
    freeDescription: string;
    steps: Array<{ title: string; description: string }>;
    selectionTitle: string;
    selectionDescription: string;
    priceNote: string;
    action: string;
  };
  professional: {
    eyebrow: string;
    title: string;
    description: string;
    approvalTitle: string;
    approvalDescription: string;
    steps: Array<{ title: string; description: string }>;
    action: string;
  };
  credits: {
    eyebrow: string;
    title: string;
    description: string;
    rows: Array<{
      label: string;
      value: string;
      description: string;
      tone: "charge" | "included" | "notice";
    }>;
    noGuarantee: string;
    balanceTitle: string;
    balanceDescription: string;
    action: string;
  };
  closingTitle: string;
  closingDescription: string;
  customerAction: string;
  professionalAction: string;
};

function getGuideCopy(locale: Locale): GuideCopy {
  if (locale === "fil") {
    return {
      eyebrow: "Malinaw na gabay sa PuntaGo",
      title: "Paano gumagana ang PuntaGo",
      description:
        "Libre para sa customers ang paghahanap, paggawa ng request, at pagkumpara ng quotes. Ang verified professionals naman ay maaaring tumanggap ng requests at magpadala ng malinaw na alok.",
      customerJump: "Para sa customers",
      professionalJump: "Para sa professionals",
      creditJump: "Quote fees at credits",
      customer: {
        eyebrow: "Para sa customers",
        title: "Mula request hanggang booking, ikaw ang pumipili.",
        description:
          "Ilarawan ang trabaho nang isang beses, tingnan ang mga alok sa iisang lugar, at piliin ang professional na pinakaangkop sa iyo.",
        freeTitle: "Libre para sa customers",
        freeDescription:
          "Walang bayad ang paggamit ng PuntaGo, paggawa ng quote request, pagtanggap ng quotes, at pagkumpara ng mga ito.",
        steps: [
          {
            title: "Gumawa ng libreng request",
            description:
              "Piliin ang service at ilagay ang detalye, lokasyon, gustong schedule, at budget para malinaw ang kailangan mo.",
          },
          {
            title: "Tumanggap at magkumpara ng quotes",
            description:
              "Ikumpara ang presyo, mensahe, rating, completed jobs, at detalye ng bawat verified professional.",
          },
          {
            title: "Piliin ang pinakaangkop na quote",
            description:
              "Hindi kailangang pinakamura ang piliin. Tingnan ang kabuuang alok at piliin ang tugma sa trabaho at budget mo.",
          },
          {
            title: "I-manage ang booking at chat",
            description:
              "Kapag napili ang quote, awtomatikong gagawa ang PuntaGo ng booking at work chat para sa napiling professional.",
          },
        ],
        selectionTitle: "Ang pagpili ng quote ang gumagawa ng booking at chat",
        selectionDescription:
          "Pagkatapos mong pumili, makikita ang trabaho sa Bookings at mabubuksan ang kaugnay na usapan sa Chat. Doon ninyo makukumpirma ang schedule at detalye.",
        priceNote:
          "Tandaan: libre ang paggamit ng platform at quote request, pero ang napiling presyo ng aktuwal na serbisyo ay babayaran ayon sa napagkasunduan ninyo ng professional. Kung magkakaroon ng customer payment o platform fee sa hinaharap, ipapakita muna ito bago mag-confirm.",
        action: "Gumawa ng libreng request",
      },
      professional: {
        eyebrow: "Para sa professionals",
        title: "Ma-approve muna, saka tumanggap ng customer requests.",
        description:
          "Pinoprotektahan ng approval process ang customers at professionals sa pamamagitan ng pagtiyak na verified ang account bago ito sumali sa customer workflow.",
        approvalTitle: "Kailangan muna ng admin approval",
        approvalDescription:
          "Kumpletuhin ang professional profile at approval requirements. Verified professionals lang ang makakatanggap ng matching requests at makakapagpadala ng quotes.",
        steps: [
          {
            title: "Kumpletuhin ang professional profile",
            description:
              "Ilagay ang services, experience, service area, at iba pang kailangang profile details.",
          },
          {
            title: "Hintayin ang admin review",
            description:
              "Ire-review ng PuntaGo admin ang profile. Kapag approved, magiging verified ang professional account.",
          },
          {
            title: "Tumanggap ng matching requests",
            description:
              "Ang verified professionals ay aabisuhan tungkol sa requests na tumutugma sa kanilang service at area.",
          },
          {
            title: "Magpadala at mag-manage ng quote",
            description:
              "Magbigay ng presyo, mensahe, at visit date. Maaari mong i-update ang quote habang open pa ang request.",
          },
        ],
        action: "Sumali bilang professional",
      },
      credits: {
        eyebrow: "Quote fees at credits",
        title: "40 PHP lang sa unang quote mo sa bawat request.",
        description:
          "Ang quote fee ay naka-base sa professional at request, hindi sa dami ng beses na in-edit ang parehong quote.",
        rows: [
          {
            label: "Unang quote sa isang request",
            value: "40 PHP",
            description: "Isang beses na ibabawas kapag unang naisumite ang quote.",
            tone: "charge",
          },
          {
            label: "Pag-edit sa parehong quote",
            value: "Walang dagdag",
            description: "Hindi na muling magbabawas ng 40 PHP para sa parehong request.",
            tone: "included",
          },
          {
            label: "Na-withdraw, na-reject, o hindi napili",
            value: "Walang auto-refund",
            description:
              "Hindi awtomatikong ibinabalik ang unang 40 PHP kapag na-withdraw, ni-reject ng customer, o hindi napili ang quote.",
            tone: "notice",
          },
          {
            label: "Hindi nakumpleto ang submission",
            value: "Walang fee",
            description:
              "Kapag hindi matagumpay na na-save ang unang quote at credit deduction, walang dapat ibawas sa balance.",
            tone: "included",
          },
        ],
        noGuarantee:
          "Ang 40 PHP ay fee sa pagpapadala ng unang quote sa request. Hindi nito ginagarantiya na pipiliin ng customer ang quote. Mananatiling available ang quote habang open ang request; walang auto-refund kapag nagsara ito nang walang napiling quote.",
        balanceTitle: "Saan makikita ang balance at history?",
        balanceDescription:
          "Buksan ang Credits page para makita ang kasalukuyang balance, mag-top up, at i-review ang recent top-ups at quote fee deductions.",
        action: "Buksan ang Credits",
      },
      closingTitle: "Handa ka nang magsimula?",
      closingDescription:
        "Gumawa ng libreng request bilang customer, o bumuo ng verified professional profile para tumanggap ng local work.",
      customerAction: "Humiling ng quotes",
      professionalAction: "Maging professional",
    };
  }

  return {
    eyebrow: "A clear guide to PuntaGo",
    title: "How PuntaGo works",
    description:
      "Customers can search, create requests, and compare quotations for free. Verified professionals can receive matching requests and send clear offers.",
    customerJump: "For customers",
    professionalJump: "For professionals",
    creditJump: "Quote fees & credits",
    customer: {
      eyebrow: "For customers",
      title: "From request to booking, you stay in control.",
      description:
        "Describe the job once, review offers in one place, and choose the professional who best fits your needs.",
      freeTitle: "Free for customers",
      freeDescription:
        "Using PuntaGo, creating a quote request, receiving quotations, and comparing them are all free for customers.",
      steps: [
        {
          title: "Create a free request",
          description:
            "Choose a service and add the job details, location, preferred schedule, and budget so professionals know what you need.",
        },
        {
          title: "Receive and compare quotations",
          description:
            "Compare the price, message, rating, completed jobs, and details of each verified professional.",
        },
        {
          title: "Choose the best-fit quotation",
          description:
            "You do not have to choose the cheapest offer. Review the full proposal and select what fits your job and budget.",
        },
        {
          title: "Manage the booking and chat",
          description:
            "When you select a quotation, PuntaGo automatically creates a booking and work chat with that professional.",
        },
      ],
      selectionTitle: "Selecting a quotation creates the booking and chat",
      selectionDescription:
        "After selection, the job appears in Bookings and its conversation becomes available in Chat. Use them to confirm the schedule and work details.",
      priceNote:
        "Remember: using the platform and requesting quotations are free, but the selected professional's service price is still payable under your agreement. If a customer payment or platform fee is introduced later, it will be shown before confirmation.",
      action: "Create a free request",
    },
    professional: {
      eyebrow: "For professionals",
      title: "Get approved first, then receive customer requests.",
      description:
        "The approval process protects customers and professionals by making sure an account is verified before it joins customer workflows.",
      approvalTitle: "Admin approval is required first",
      approvalDescription:
        "Complete your professional profile and approval requirements. Only verified professionals can receive matching requests and send quotations.",
      steps: [
        {
          title: "Complete your professional profile",
          description:
            "Add your services, experience, service area, and the other required profile details.",
        },
        {
          title: "Wait for admin review",
          description:
            "A PuntaGo admin reviews the profile. Once approved, the professional account becomes verified.",
        },
        {
          title: "Receive matching requests",
          description:
            "Verified professionals are notified about requests that match their service and area.",
        },
        {
          title: "Send and manage a quotation",
          description:
            "Provide a price, message, and visit date. You can update the quotation while the request remains open.",
        },
      ],
      action: "Join as a professional",
    },
    credits: {
      eyebrow: "Quote fees & credits",
      title: "40 PHP only for your first quotation on each request.",
      description:
        "The quote fee is tied to the professional and request, not to the number of times the same quotation is edited.",
      rows: [
        {
          label: "First quotation on a request",
          value: "40 PHP",
          description: "Deducted once when the quotation is first submitted.",
          tone: "charge",
        },
        {
          label: "Editing that same quotation",
          value: "No extra charge",
          description: "The same request is not charged another 40 PHP.",
          tone: "included",
        },
          {
            label: "Withdrawn, rejected, or not selected",
            value: "No automatic refund",
            description:
              "The first 40 PHP is not automatically returned if the quote is withdrawn, rejected by the customer, or not selected.",
            tone: "notice",
          },
          {
            label: "Submission does not complete",
            value: "No fee",
            description:
              "If the first quote and its credit deduction are not successfully saved, no credit should be deducted from the balance.",
            tone: "included",
          },
      ],
      noGuarantee:
        "The 40 PHP is the fee for sending your first quotation on a request. It does not guarantee selection. The quotation remains available while the request is open; closing without a selection does not trigger an automatic refund.",
      balanceTitle: "Where can I see my balance and history?",
      balanceDescription:
        "Open the Credits page to see your current balance, top up, and review recent top-ups and quotation fee deductions.",
      action: "Open Credits",
    },
    closingTitle: "Ready to get started?",
    closingDescription:
      "Create a free customer request, or build a verified professional profile to receive local work.",
    customerAction: "Request quotations",
    professionalAction: "Become a professional",
  };
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
    >
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}

export function HowItWorksGuide({ locale }: { locale: Locale }) {
  const text = getGuideCopy(locale);

  return (
    <div className="pb-28 md:pb-0">
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-center lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <span className="eyebrow-pill">{text.eyebrow}</span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              {text.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              {text.description}
            </p>

            <nav className="mt-7 flex flex-wrap gap-2" aria-label={text.title}>
              {[
                { href: "#customers", label: text.customerJump },
                { href: "#professionals", label: text.professionalJump },
                { href: "#credits", label: text.creditJump },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-800 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                >
                  {item.label}
                  <span aria-hidden="true">↓</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[17rem] items-center justify-center rounded-[28px] border border-teal-100 bg-teal-50 shadow-[0_24px_60px_-42px_rgba(15,118,110,0.75)] lg:max-w-none">
            <div className="absolute inset-5 rounded-[22px] border border-white bg-white/75" />
            <Image
              src="/brand/puntago-logo-192.png"
              alt="PuntaGo"
              width={192}
              height={192}
              priority
              unoptimized
              className="relative h-28 w-28 object-contain sm:h-36 sm:w-36"
            />
          </div>
        </div>
      </section>

      <section id="customers" className="scroll-mt-24 border-b border-slate-200/80 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase text-teal-700">
              {text.customer.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">
              {text.customer.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {text.customer.description}
            </p>
          </div>

          <div className="mt-8 flex items-start gap-3 border-l-4 border-teal-600 bg-white px-4 py-5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.4)] sm:px-6">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white">
              <CheckIcon />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-950">{text.customer.freeTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {text.customer.freeDescription}
              </p>
            </div>
          </div>

          <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {text.customer.steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-32px_rgba(15,23,42,0.35)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-black leading-6 text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 grid overflow-hidden rounded-[24px] border border-teal-200 bg-teal-950 text-white lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-black leading-7">{text.customer.selectionTitle}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-teal-50/85">
                {text.customer.selectionDescription}
              </p>
              <p className="mt-4 border-t border-white/15 pt-4 text-xs leading-5 text-teal-50/70">
                {text.customer.priceNote}
              </p>
            </div>
            <div className="border-t border-white/15 p-6 lg:border-l lg:border-t-0 lg:p-8">
              <Link
                href="/quote-request"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black !text-teal-950 transition hover:bg-teal-50 hover:!text-teal-800 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:w-auto"
              >
                {text.customer.action}
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="professionals" className="scroll-mt-24 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div>
              <p className="text-xs font-black uppercase text-amber-700">
                {text.professional.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">
                {text.professional.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                {text.professional.description}
              </p>

              <div className="mt-7 border-l-4 border-amber-500 bg-amber-50 px-5 py-5">
                <h3 className="text-base font-black text-slate-950">
                  {text.professional.approvalTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {text.professional.approvalDescription}
                </p>
              </div>

              <Link
                href="/signup"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black !text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              >
                {text.professional.action}
                <ArrowIcon />
              </Link>
            </div>

            <ol className="grid gap-3 sm:grid-cols-2">
              {text.professional.steps.map((step, index) => (
                <li key={step.title} className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-950">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-black leading-6 text-slate-950">{step.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="credits" className="scroll-mt-24 border-b border-slate-200/80 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase text-teal-300">
              {text.credits.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-normal sm:text-4xl">
              {text.credits.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              {text.credits.description}
            </p>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            {text.credits.rows.map((row) => {
              const valueClass =
                row.tone === "charge"
                  ? "text-amber-300"
                  : row.tone === "included"
                    ? "text-teal-300"
                    : "text-rose-300";

              return (
                <article key={row.label} className="rounded-[22px] border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-sm font-bold leading-6 text-slate-200">{row.label}</p>
                  <p className={`mt-3 text-2xl font-black leading-tight ${valueClass}`}>{row.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{row.description}</p>
                </article>
              );
            })}
          </div>

          <p className="mt-5 max-w-4xl text-sm leading-6 text-slate-400">{text.credits.noGuarantee}</p>

          <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-black">{text.credits.balanceTitle}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                {text.credits.balanceDescription}
              </p>
            </div>
            <Link
              href="/settlements"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 text-sm font-black !text-slate-950 transition hover:bg-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
            >
              {text.credits.action}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black leading-tight tracking-normal text-slate-950">
              {text.closingTitle}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{text.closingDescription}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/quote-request"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 text-sm font-black !text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            >
              {text.customerAction}
              <ArrowIcon />
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            >
              {text.professionalAction}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
