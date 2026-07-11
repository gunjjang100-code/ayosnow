import { HowItWorksGuide } from "@/components/guidance/how-it-works-guide";
import { getCurrentLocale } from "@/lib/i18n-server";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "How PuntaGo Works",
  description:
    "Learn how customers request and compare quotations for free, how bookings and chat are created, and how professional quote credits work on PuntaGo.",
  path: "/how-it-works",
});

export default async function HowItWorksPage() {
  const locale = await getCurrentLocale();
  const publicLocale = locale === "fil" ? "fil" : "en";

  return <HowItWorksGuide locale={publicLocale} />;
}
