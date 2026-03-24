import "server-only";

import { cookies } from "next/headers";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(localeCookieName)?.value;

  return isLocale(value) ? value : defaultLocale;
}
