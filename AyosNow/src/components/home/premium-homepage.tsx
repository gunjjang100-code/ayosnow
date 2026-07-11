import Image from "next/image";
import Link from "next/link";

import type { Category, Locale, ReviewPreview, ServiceSummary } from "@/lib/types";

type MarketplaceStats = {
  jobsCompleted: number;
  professionals: number;
  averageRating: number;
  customerSatisfaction: number;
};

interface PremiumHomePageProps {
  locale: Locale;
  categories: Category[];
  featuredServices: ServiceSummary[];
  reviews: ReviewPreview[];
  marketplaceStats: MarketplaceStats;
  quoteRequestHref: string;
}

const serviceIconPaths = [
  "M8 20h8M9 20l1-8h4l1 8M10 12V8a2 2 0 0 1 4 0v4M6 20h12",
  "M7 8h10M7 12h10M9 16h6M5 8h2v8H5zM17 8h2v8h-2z",
  "M13 2 5 14h6l-2 8 8-12h-6z",
  "M5 8h14v8H5zM8 16v3M16 16v3M8 11h8",
  "M6 10h12v8H6zM8 10V7h8v3M8 18v3M16 18v3",
  "M4 13h11v5H4zM15 15h3l2 3h-5zM7 18a2 2 0 1 0 0 .1M17 18a2 2 0 1 0 0 .1",
];

function getHomeCopy(locale: Locale) {
  if (locale === "en") {
    return {
      heroEyebrow: "Starting in Pangasinan. Built for the Philippines.",
      heroTitleLead: "Find trusted local professionals",
      heroTitleAccent: "near you.",
      heroDescription:
        "Now serving Pangasinan. PuntaGo connects customers with verified local professionals for fair quotations, fast matching, bookings, chat, and reviews.",
      visionTitle: "One platform for every trusted local professional.",
      visionDescription:
        "Built for everyday local services, from home repair and cleaning to events, care, lessons, and tech support.",
      expansionNote: "Growing city by city across the Philippines.",
      categoryPills: [
        "Home Repair",
        "Cleaning",
        "Air Conditioning",
        "Plumbing",
        "Electrical",
        "Private Chef",
        "Catering",
        "Photography",
        "Videography",
        "Makeup Artist",
        "Hair Stylist",
        "Personal Trainer",
        "Tutors",
        "Pet Care",
        "Elderly Care",
        "Event Staff",
        "Bartender",
        "Barista",
        "Moving",
        "IT Support",
      ],
      trustBadges: ["Verified local pros", "Fair quotations", "Fast matching"],
      customerFreeNote:
        "Free for customers: create a request, receive quotations, and compare professionals without PuntaGo credits.",
      howItWorksLink: "See how PuntaGo works",
      defaultServiceCards: [
        { id: "default-home-repair", href: "/services?q=Home%20Repair", title: "Home Repair", description: "Repairs, fixes, maintenance" },
        { id: "default-cleaning", href: "/services?q=Cleaning", title: "Cleaning", description: "Homes, offices, deep cleaning" },
        { id: "default-aircon", href: "/services?q=Aircon", title: "Air Conditioning", description: "Cleaning, repair, installation" },
        { id: "default-plumbing", href: "/services?q=Plumbing", title: "Plumbing", description: "Leaks, repairs, installation" },
        { id: "default-events", href: "/services?q=Events", title: "Events", description: "Chef, catering, staff, media" },
        { id: "default-care-tech", href: "/services?q=Care", title: "Care & Tech", description: "Tutors, pet care, IT support" },
      ],
      phoneGreeting: "Hello, Juan",
      phoneQuestion: "What service do you need?",
      phoneSearch: "Search services",
      popularServices: "Popular Services",
      seeAll: "See all",
      verifiedProfessionals: "Verified professionals",
      qualityPeace: "Quality services. Peace of mind.",
      recommended: "Recommended for you",
      homeCleaning: "Home Cleaning",
      fromPrice: "From ₱500",
      averageRating: "Average Rating",
      jobsCompleted: "Jobs Completed",
      verifiedPros: "Verified Pros",
      serviceNeedLabel: "What service do you need?",
      servicePlaceholder: "e.g. Cleaning, Plumbing, Private Chef",
      locationLabel: "Where are you?",
      locationPlaceholder: "Pangasinan, city, or barangay",
      findProfessionals: "Find a Professional",
      servicesSubtitle: "Trusted local help for everyday work, special events, care, lessons, and more.",
      steps: [
        ["1", "Tell us what you need", "Choose a service, location, budget, and schedule in a few taps."],
        ["2", "Compare fair quotations", "Review prices, messages, ratings, and verified professional details."],
        ["3", "Book with confidence", "Keep chat, bookings, files, reviews, and updates in one trusted place."],
      ],
      forProfessionals: "For Professionals",
      proTitlePrefix: "Grow your local service business with",
      proDescription:
        "PuntaGo helps verified professionals in Pangasinan receive quote requests, manage bookings, build trust, and prepare for future city-by-city growth.",
      benefits: ["Receive local customer requests", "Send clear, fair quotations", "Manage bookings and chat in one place", "Build your verified reputation"],
      professionalPricingNote:
        "Admin approval is required before customer work. The first quote for each request uses 40 PHP in credits; editing that same quote does not deduct again.",
      joinProfessional: "Become a Professional",
      learnMore: "Explore PuntaGo Services",
      testimonialsTitle: "Built for local trust",
      testimonialsSubtitle: "Real reviews will help every community choose professionals with confidence.",
      noReviewsTitle: "Real customer reviews will appear here after completed bookings.",
      noReviewsBody: "PuntaGo only shows reviews tied to real platform activity.",
      finalCtaTitle: "Starting in Pangasinan. Built for the Philippines.",
      finalCtaBody:
        "Find trusted local professionals today, and join a platform designed to grow across more cities and provinces.",
      downloadOn: "Download on",
      earningsOverview: "Earnings Overview",
      demoEarningsNote: "Example numbers, not account earnings",
      fromLastMonth: "+18.6% from last month",
      today: "Today",
      thisWeek: "This Week",
      weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      professionalImageAlt: "Smiling PuntaGo service professional",
    };
  }

  if (locale === "fil") {
    return {
      heroEyebrow: "Nagsisimula sa Pangasinan. Para sa buong Pilipinas.",
      heroTitleLead: "Humanap ng trusted local professionals",
      heroTitleAccent: "malapit sa iyo.",
      heroDescription:
        "Available na sa Pangasinan. Kinokonekta ng PuntaGo ang customers sa verified local professionals para sa fair quotations, mabilis na matching, bookings, chat, at reviews.",
      visionTitle: "Isang platform para sa bawat trusted local professional.",
      visionDescription:
        "Para sa everyday local services, mula home repair at cleaning hanggang events, care, lessons, at tech support.",
      expansionNote: "Lalago city by city sa buong Pilipinas.",
      categoryPills: [
        "Home Repair",
        "Cleaning",
        "Air Conditioning",
        "Plumbing",
        "Electrical",
        "Private Chef",
        "Catering",
        "Photography",
        "Videography",
        "Makeup Artist",
        "Hair Stylist",
        "Personal Trainer",
        "Tutors",
        "Pet Care",
        "Elderly Care",
        "Event Staff",
        "Bartender",
        "Barista",
        "Moving",
        "IT Support",
      ],
      trustBadges: ["Verified local pros", "Fair quotations", "Mabilis na matching"],
      customerFreeNote:
        "Libre para sa customers: gumawa ng request, tumanggap ng quotations, at magkumpara ng professionals nang walang PuntaGo credits.",
      howItWorksLink: "Tingnan kung paano gumagana ang PuntaGo",
      defaultServiceCards: [
        { id: "default-home-repair", href: "/services?q=Home%20Repair", title: "Home Repair", description: "Repairs, fixes, maintenance" },
        { id: "default-cleaning", href: "/services?q=Cleaning", title: "Cleaning", description: "Bahay, opisina, deep cleaning" },
        { id: "default-aircon", href: "/services?q=Aircon", title: "Air Conditioning", description: "Cleaning, repair, installation" },
        { id: "default-plumbing", href: "/services?q=Plumbing", title: "Plumbing", description: "Tagas, repair, installation" },
        { id: "default-events", href: "/services?q=Events", title: "Events", description: "Chef, catering, staff, media" },
        { id: "default-care-tech", href: "/services?q=Care", title: "Care & Tech", description: "Tutors, pet care, IT support" },
      ],
      phoneGreeting: "Hello, Juan",
      phoneQuestion: "Anong service ang kailangan mo?",
      phoneSearch: "Maghanap ng service",
      popularServices: "Popular Services",
      seeAll: "Tingnan lahat",
      verifiedProfessionals: "Verified professionals",
      qualityPeace: "Quality service. Peace of mind.",
      recommended: "Recommended para sa iyo",
      homeCleaning: "Home Cleaning",
      fromPrice: "Mula ₱500",
      averageRating: "Average Rating",
      jobsCompleted: "Jobs Completed",
      verifiedPros: "Verified Pros",
      serviceNeedLabel: "Anong service ang kailangan mo?",
      servicePlaceholder: "hal. Cleaning, Plumbing, Private Chef",
      locationLabel: "Nasaan ka?",
      locationPlaceholder: "Pangasinan, city, o barangay",
      findProfessionals: "Humanap ng Professional",
      servicesSubtitle: "Trusted local help para sa araw-araw na trabaho, events, care, lessons, at iba pa.",
      steps: [
        ["1", "Sabihin ang kailangan mo", "Pumili ng service, lokasyon, budget, at schedule sa ilang taps."],
        ["2", "Ikumpara ang fair quotations", "Tingnan ang presyo, messages, ratings, at verified professional details."],
        ["3", "Mag-book nang may tiwala", "Chat, bookings, files, reviews, at updates ay nasa isang trusted place."],
      ],
      forProfessionals: "Para sa Professionals",
      proTitlePrefix: "Palakihin ang local service business mo sa",
      proDescription:
        "Tinutulungan ng PuntaGo ang verified professionals sa Pangasinan na makatanggap ng quote requests, mag-manage ng bookings, at bumuo ng tiwala habang lumalago ang platform city by city.",
      benefits: ["Tumanggap ng local customer requests", "Magpadala ng malinaw at fair quotations", "I-manage ang bookings at chat sa isang lugar", "Palakasin ang verified reputation mo"],
      professionalPricingNote:
        "Kailangan muna ng admin approval bago humarap sa customers. Ang unang quote sa bawat request ay gumagamit ng 40 PHP credits; walang panibagong bawas kapag in-edit ang parehong quote.",
      joinProfessional: "Maging Professional",
      learnMore: "Tingnan ang PuntaGo Services",
      testimonialsTitle: "Ginawa para sa local trust",
      testimonialsSubtitle: "Tutulong ang real reviews para mas confident pumili ang bawat community.",
      noReviewsTitle: "Lalabas dito ang real customer reviews pagkatapos ng completed bookings.",
      noReviewsBody: "Ipinapakita lang ng PuntaGo ang reviews na konektado sa totoong platform activity.",
      finalCtaTitle: "Nagsisimula sa Pangasinan. Para sa buong Pilipinas.",
      finalCtaBody:
        "Humanap ng trusted local professionals ngayon, at sumali sa platform na lalago sa mas maraming cities at provinces.",
      downloadOn: "Download sa",
      earningsOverview: "Earnings Overview",
      demoEarningsNote: "Halimbawa lang, hindi totoong account earnings",
      fromLastMonth: "+18.6% mula noong nakaraang buwan",
      today: "Ngayon",
      thisWeek: "This Week",
      weekDays: ["Lun", "Mar", "Miy", "Huw", "Biy", "Sab", "Lin"],
      professionalImageAlt: "Nakangiting PuntaGo service professional",
    };
  }

  return getHomeCopy("en");
}

function formatCompact(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 100) / 10}K+`;
  }

  return `${value}+`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Icon({
  path,
  className = "h-6 w-6",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d={path} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m5 10 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function PhoneMockup({
  copy,
  marketplaceStats,
  className = "",
}: {
  copy: ReturnType<typeof getHomeCopy>;
  marketplaceStats: MarketplaceStats;
  className?: string;
}) {
  const ratingLabel =
    marketplaceStats.averageRating > 0 ? marketplaceStats.averageRating.toFixed(1) : "New";
  const jobsLabel =
    marketplaceStats.jobsCompleted > 0 ? formatCompact(marketplaceStats.jobsCompleted) : "Ready";
  const professionalsLabel =
    marketplaceStats.professionals > 0 ? formatCompact(marketplaceStats.professionals) : "Growing";

  return (
    <div className={`relative mx-auto min-h-[430px] w-full max-w-[560px] sm:min-h-[560px] ${className}`}>
      <div className="absolute -right-12 top-8 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle_at_45%_42%,rgba(255,255,255,0.96),rgba(240,253,250,0.72)_38%,rgba(245,158,11,0.16)_72%,transparent_73%)] blur-sm sm:-right-8 sm:h-[470px] sm:w-[470px]" />
      <div className="absolute inset-0 rounded-[52px] bg-[radial-gradient(circle_at_70%_20%,rgba(15,118,110,0.18),transparent_34%),radial-gradient(circle_at_25%_70%,rgba(245,158,11,0.18),transparent_28%)] blur-2xl" />

      <div className="home-float absolute right-2 top-7 z-20 rounded-[20px] border border-white/80 bg-white/96 p-3 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.56)] backdrop-blur sm:right-0 sm:top-12 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-slate-950 sm:text-3xl">
            {ratingLabel}
          </span>
          <span className="text-2xl text-amber-400">★</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-500">{copy.averageRating}</p>
      </div>

      <div className="home-float-slow absolute bottom-16 right-2 z-20 rounded-[20px] border border-white/80 bg-white/96 p-3 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.56)] backdrop-blur sm:right-0 sm:bottom-24 sm:p-5">
        <p className="text-2xl font-black text-teal-700 sm:text-3xl">{jobsLabel}</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">{copy.jobsCompleted}</p>
      </div>

      <div className="home-float-slower absolute left-1 top-48 z-20 flex items-center gap-3 rounded-[20px] border border-white/80 bg-white/96 px-3 py-2.5 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.56)] backdrop-blur sm:left-0 sm:top-56 sm:px-4 sm:py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-black text-white">
          P
        </div>
        <div>
          <p className="text-sm font-black text-slate-950">{professionalsLabel}</p>
          <p className="text-xs font-semibold text-slate-500">{copy.verifiedPros}</p>
        </div>
      </div>

      <div className="relative mx-auto h-[420px] w-[212px] rotate-[6deg] rounded-[40px] border-[8px] border-slate-950 bg-slate-950 shadow-[0_40px_95px_-44px_rgba(15,23,42,0.9)] sm:h-[540px] sm:w-[272px] sm:rotate-[8deg] sm:border-[10px]">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />
        <div className="h-full overflow-hidden rounded-[35px] bg-white">
          <div className="bg-gradient-to-br from-teal-50 via-white to-amber-50 p-5 pt-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">{copy.phoneGreeting}</p>
                <p className="mt-1 text-lg font-black text-slate-950">{copy.phoneQuestion}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-xs font-black text-white">
                P
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-3 py-3 text-xs font-semibold text-slate-400 shadow-sm">
              {copy.phoneSearch}
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-950">{copy.popularServices}</p>
              <p className="text-xs font-bold text-teal-700">{copy.seeAll}</p>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {["CL", "PL", "EL", "AC"].map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 p-2 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-black text-teal-700 shadow-sm">
                    {item}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[22px] bg-gradient-to-br from-teal-800 to-slate-950 p-4 text-white">
              <p className="text-sm font-black">{copy.verifiedProfessionals}</p>
              <p className="mt-1 text-xs leading-5 text-teal-50">{copy.qualityPeace}</p>
              <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                <CheckIcon />
              </div>
            </div>
            <div className="mt-4 rounded-[22px] border border-slate-100 bg-white p-3 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.38)]">
              <p className="text-xs font-bold text-slate-500">{copy.recommended}</p>
              <div className="mt-3 flex gap-3">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-teal-100" />
                <div>
                  <p className="text-sm font-black text-slate-950">{copy.homeCleaning}</p>
                  <p className="mt-1 text-xs text-slate-500">{copy.fromPrice}</p>
                  <p className="mt-1 text-xs font-bold text-amber-500">★ 4.8</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfessionalVisual({
  copy,
  className = "",
  imagePriority = false,
}: {
  copy: ReturnType<typeof getHomeCopy>;
  className?: string;
  imagePriority?: boolean;
}) {
  return (
    <div className={`relative min-h-[500px] overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#f7fbf8_0%,#eef8f4_45%,#ffffff_100%)] p-3 shadow-[0_30px_90px_-62px_rgba(15,23,42,0.68)] sm:min-h-[590px] sm:rounded-[40px] sm:p-6 lg:min-h-[620px] ${className}`}>
      <div className="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-white/80 blur-3xl" />
      <div className="absolute -right-28 bottom-16 h-96 w-96 rounded-full bg-teal-100/70 blur-3xl" />
      <div className="absolute bottom-0 left-2 h-[470px] w-[82%] rounded-t-[999px] rounded-b-[52px] bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-950 shadow-[0_32px_90px_-48px_rgba(15,118,110,0.9)] sm:left-12 sm:h-[500px] sm:w-[62%]" />
      <div className="absolute right-2 top-10 h-[390px] w-[58%] rounded-[44px] bg-white/74 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.55)] backdrop-blur sm:right-8 sm:top-12 sm:h-[450px] sm:rounded-[52px]" />
      <div className="absolute left-8 top-24 h-24 w-24 rounded-[32px] bg-amber-300/18 blur-xl" />

      <div className="relative z-10 flex min-h-[468px] items-end justify-center sm:min-h-[570px]">
        <div className="relative h-[455px] w-[78%] max-w-[390px] overflow-hidden rounded-t-[180px] rounded-b-[34px] border-[7px] border-white/70 bg-white shadow-[0_34px_96px_-54px_rgba(15,23,42,0.76)] sm:h-[555px] sm:w-[64%] sm:rounded-t-[210px] sm:rounded-b-[42px] sm:border-[9px] lg:w-[58%]">
          <Image
            src="/home/professional-portrait-900.jpg"
            alt={copy.professionalImageAlt}
            fill
            sizes="(max-width: 640px) 86vw, (max-width: 1024px) 420px, 390px"
            className="object-cover object-[center_28%]"
            priority={imagePriority}
            unoptimized
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/18 to-transparent" />
        </div>

        <div className="home-float absolute bottom-4 right-3 z-20 w-[min(58%,220px)] rounded-[22px] border border-white/90 bg-white/96 p-3 shadow-[0_24px_66px_-46px_rgba(15,23,42,0.66)] backdrop-blur sm:bottom-auto sm:right-4 sm:top-32 sm:w-[270px] sm:rounded-[28px] sm:p-4 lg:right-6 lg:top-36 xl:right-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black text-slate-950 sm:text-sm">{copy.earningsOverview}</p>
          </div>
          <p className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:mt-3 sm:text-3xl">₱28,420</p>
          <p className="mt-1 text-xs font-black text-teal-700 sm:text-sm">{copy.fromLastMonth}</p>
          <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500 sm:text-xs">{copy.demoEarningsNote}</p>

          <div className="mt-3 rounded-[18px] bg-slate-50 p-2.5 sm:mt-4 sm:rounded-[22px] sm:p-3">
            <svg viewBox="0 0 260 96" aria-hidden="true" className="h-12 w-full overflow-visible sm:h-16">
              <defs>
                <linearGradient id="proChartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M8 72 C28 50 42 54 60 42 C78 29 91 72 112 61 C131 51 143 72 160 64 C178 55 184 35 202 41 C224 48 232 50 252 22"
                fill="none"
                stroke="#0f766e"
                strokeLinecap="round"
                strokeWidth="6"
              />
              <path
                d="M8 72 C28 50 42 54 60 42 C78 29 91 72 112 61 C131 51 143 72 160 64 C178 55 184 35 202 41 C224 48 232 50 252 22 L252 96 L8 96 Z"
                fill="url(#proChartFill)"
              />
              <circle cx="8" cy="72" r="5" fill="#0f766e" />
              <circle cx="252" cy="22" r="6" fill="#0f766e" />
            </svg>
            <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-600 sm:text-xs">
              {copy.weekDays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:mt-4 sm:gap-4 sm:pt-4">
          <div>
            <p className="text-xl font-black text-slate-950 sm:text-3xl">3</p>
            <p className="text-xs font-bold text-slate-500 sm:text-sm">{copy.today}</p>
          </div>
          <div>
            <p className="text-xl font-black text-slate-950 sm:text-3xl">5</p>
            <p className="text-xs font-bold text-slate-500 sm:text-sm">{copy.thisWeek}</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export function PremiumHomePage({
  locale,
  categories,
  featuredServices,
  reviews,
  marketplaceStats,
  quoteRequestHref,
}: PremiumHomePageProps) {
  const publicLocale = locale === "fil" ? "fil" : "en";
  const homeCopy = getHomeCopy(publicLocale);
  const topServices = featuredServices.slice(0, 6);
  const serviceCards = [
    ...topServices.map((service, index) => ({
      id: service.id,
      href: `/services/${service.slug}`,
      title: service.categoryName,
      description: service.title,
      iconIndex: index,
    })),
    ...categories
      .filter((category) => !topServices.some((service) => service.categoryName === category.name))
      .slice(0, Math.max(0, 6 - topServices.length))
      .map((category, index) => ({
        id: category.slug,
        href: `/services?category=${category.slug}`,
        title: category.name,
        description: category.shortDescription,
        iconIndex: topServices.length + index,
      })),
    ...homeCopy.defaultServiceCards.map((service, index) => ({
      ...service,
      iconIndex: topServices.length + categories.length + index,
    })),
  ].slice(0, 6);
  const testimonials = reviews.slice(0, 3);
  const primaryCategory = categories[0]?.name ?? "Manila";

  return (
    <div className="bg-[#FAFAFA] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_82%_28%,rgba(15,118,110,0.14),transparent_34%),radial-gradient(circle_at_12%_78%,rgba(245,158,11,0.09),transparent_30%),linear-gradient(180deg,#fff_0%,#fbfaf7_56%,#f3f8f5_100%)] lg:bg-[radial-gradient(circle_at_80%_18%,rgba(15,118,110,0.14),transparent_32%),radial-gradient(circle_at_12%_78%,rgba(245,158,11,0.09),transparent_30%),linear-gradient(90deg,#fff_0%,#fbfaf7_52%,#f3f8f5_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-8 sm:px-6 md:py-14 lg:min-h-[660px] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-12 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-teal-800 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]">
              {homeCopy.heroEyebrow}
            </span>
            <h1 className="max-w-3xl text-[2.45rem] font-black leading-[1.03] tracking-normal text-slate-950 sm:text-5xl lg:text-[4.4rem] lg:leading-[0.98]">
              {homeCopy.heroTitleLead}{" "}
              <span className="text-teal-700">{homeCopy.heroTitleAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mt-7 lg:text-xl lg:leading-9">
              {homeCopy.heroDescription}
            </p>

            <PhoneMockup
              copy={homeCopy}
              marketplaceStats={marketplaceStats}
              className="mt-7 lg:hidden"
            />

            <form
              action="/services"
              className="mt-6 grid gap-3 rounded-[26px] border border-white/80 bg-white/96 p-3 shadow-[0_22px_70px_-54px_rgba(15,23,42,0.58)] md:mt-8 md:grid-cols-[1fr_0.86fr_auto]"
              aria-label="Find a professional"
            >
              <label className="grid gap-1 rounded-[22px] border border-slate-100 bg-white px-4 py-4 transition focus-within:border-teal-200 focus-within:ring-4 focus-within:ring-teal-50">
                <span className="text-xs font-black text-slate-950">{homeCopy.serviceNeedLabel}</span>
                <input
                  name="q"
                  type="search"
                  placeholder={homeCopy.servicePlaceholder}
                  className="min-h-9 bg-transparent text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 md:text-sm"
                />
              </label>
              <label className="grid gap-1 rounded-[22px] border border-slate-100 bg-white px-4 py-4 transition focus-within:border-teal-200 focus-within:ring-4 focus-within:ring-teal-50">
                <span className="text-xs font-black text-slate-950">{homeCopy.locationLabel}</span>
                <input
                  name="location"
                  type="search"
                  placeholder={homeCopy.locationPlaceholder}
                  className="min-h-9 bg-transparent text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 md:text-sm"
                />
              </label>
              <button
                type="submit"
                className="min-h-14 rounded-[22px] bg-teal-700 px-7 text-base font-black !text-white shadow-[0_20px_38px_-24px_rgba(15,118,110,0.95)] transition hover:-translate-y-0.5 hover:bg-teal-800 active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 md:min-h-16 md:text-sm"
              >
                {homeCopy.findProfessionals}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3">
              {homeCopy.trustBadges.map((badge) => (
                <div
                  key={badge}
                  className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3.5 py-2 text-xs font-black text-slate-700 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.45)] sm:px-4"
                >
                  <CheckIcon />
                  {badge}
                </div>
              ))}
            </div>
            <div className="mt-4 flex max-w-xl flex-col gap-2 rounded-[20px] border border-teal-100 bg-white/90 px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_16px_42px_-36px_rgba(15,23,42,0.5)] sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold">{homeCopy.customerFreeNote}</p>
              <Link
                href="/how-it-works"
                className="shrink-0 font-black text-teal-700 underline decoration-teal-200 underline-offset-4"
              >
                {homeCopy.howItWorksLink}
              </Link>
            </div>
            <p className="mt-5 max-w-xl text-sm font-bold leading-6 text-slate-500">
              {homeCopy.expansionNote}
            </p>
          </div>

          <PhoneMockup copy={homeCopy} marketplaceStats={marketplaceStats} className="hidden lg:block" />
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">{homeCopy.popularServices}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
            {homeCopy.servicesSubtitle}
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-5xl rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_18px_58px_-52px_rgba(15,23,42,0.42)]">
          <div className="text-center">
            <p className="text-sm font-black text-slate-950">{homeCopy.visionTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{homeCopy.visionDescription}</p>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {homeCopy.categoryPills.map((item) => (
              <span
                key={item}
                className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-800"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
          {serviceCards.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className="group flex min-h-[178px] flex-col items-center rounded-[22px] border border-slate-100 bg-white p-4 text-center shadow-[0_18px_54px_-46px_rgba(15,23,42,0.5)] transition duration-300 hover:-translate-y-1.5 hover:border-teal-100 hover:shadow-[0_26px_76px_-50px_rgba(15,23,42,0.62)] sm:min-h-[205px] sm:p-6"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white sm:h-16 sm:w-16 sm:rounded-[22px]">
                <Icon path={serviceIconPaths[service.iconIndex % serviceIconPaths.length]} />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-950 sm:mt-5 sm:text-lg">{service.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{service.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:gap-10 lg:px-8 lg:py-16">
          {homeCopy.steps.map(([step, title, body]) => (
            <div key={step} className="rounded-[24px] border border-slate-100 bg-[#FAFAFA] p-6 shadow-[0_18px_58px_-52px_rgba(15,23,42,0.42)] sm:p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-sm font-black text-white">
                {step}
              </div>
              <h3 className="mt-6 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="professionals" className="overflow-hidden bg-[linear-gradient(180deg,#fbfaf7,#f6faf8)] lg:bg-[linear-gradient(90deg,#fbfaf7,#f6faf8)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-10 lg:px-8 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-teal-800">
              <CheckIcon /> {homeCopy.forProfessionals}
            </span>
            <h2 className="mt-6 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl lg:mt-7">
              {homeCopy.proTitlePrefix} <span className="text-teal-700">PuntaGo</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              {homeCopy.proDescription}
            </p>
            <div className="mt-5 max-w-xl rounded-[22px] border border-teal-100 bg-teal-50/70 px-5 py-4 text-sm font-semibold leading-6 text-teal-950">
              {homeCopy.professionalPricingNote}
            </div>

            <ProfessionalVisual copy={homeCopy} className="mt-8 lg:hidden" imagePriority />

            <div className="mt-8 grid gap-4">
              {homeCopy.benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-sm font-black text-slate-800">
                  <CheckIcon />
                  {benefit}
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-teal-700 px-8 text-sm font-black !text-white shadow-[0_20px_36px_-24px_rgba(15,118,110,0.9)] transition hover:-translate-y-0.5 hover:bg-teal-800 active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {homeCopy.joinProfessional}
              </Link>
              <Link
                href="/services"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 text-sm font-black text-slate-900 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50 active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {homeCopy.learnMore}
              </Link>
            </div>
          </div>

          <ProfessionalVisual copy={homeCopy} className="hidden lg:block" imagePriority />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">{homeCopy.testimonialsTitle}</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">{homeCopy.testimonialsSubtitle}</p>
        </div>
        <div className="mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible">
          {testimonials.length > 0 ? (
            testimonials.map((review) => (
              <article
                key={review.id}
                className="min-w-full snap-center rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_22px_70px_-52px_rgba(15,23,42,0.55)] sm:min-w-[48%] sm:p-7 lg:min-w-0"
              >
                <p className="text-lg tracking-[0.18em] text-teal-600">★★★★★</p>
                <p className="mt-4 min-h-24 text-base leading-7 text-slate-700">“{review.comment}”</p>
                <div className="mt-7 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-amber-100 text-sm font-black text-teal-800">
                    {getInitials(review.author) || "P"}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">{review.author}</p>
                    <p className="text-xs font-semibold text-slate-500">{review.location ?? primaryCategory}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="min-w-full snap-center rounded-[24px] border border-dashed border-slate-200 bg-white p-7 text-center sm:min-w-[48%] lg:col-span-3 lg:min-w-0">
              <p className="text-base font-bold text-slate-950">{homeCopy.noReviewsTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{homeCopy.noReviewsBody}</p>
            </article>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_88%_30%,rgba(20,184,166,0.28),transparent_28%),linear-gradient(135deg,#064e3b,#0f172a)] p-8 text-white shadow-[0_30px_90px_-52px_rgba(15,23,42,0.8)] md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-normal md:text-4xl">{homeCopy.finalCtaTitle}</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-teal-50">{homeCopy.finalCtaBody}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={quoteRequestHref}
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-7 text-sm font-black !text-slate-950 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:!text-teal-800 active:translate-y-0 active:scale-[0.98]"
                >
                  {homeCopy.findProfessionals}
                </Link>
                <Link href="/signup" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/45 bg-white/16 px-7 text-sm font-black !text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:-translate-y-0.5 hover:bg-white/24 active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  {homeCopy.joinProfessional}
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {["Google Play", "App Store"].map((store) => (
                <div key={store} className="flex min-h-14 items-center gap-3 rounded-2xl bg-black px-5 text-white">
                  <span className="text-lg">▶</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-white/70">{homeCopy.downloadOn}</p>
                    <p className="text-sm font-black">{store}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
