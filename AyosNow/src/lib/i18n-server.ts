import { cookies } from "next/headers";

import { defaultLocale, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("site-lang")?.value;

  // Production public site supports English and Filipino only.
  // Old unsupported language cookies are safely ignored and fall back to English.
  return isLocale(cookieValue) ? cookieValue : defaultLocale;
}
