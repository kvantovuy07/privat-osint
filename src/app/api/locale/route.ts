import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
} from "@/lib/i18n";

function sanitizeRedirect(input: string | null) {
  if (!input || !input.startsWith("/")) {
    return "/login";
  }

  if (input.startsWith("//")) {
    return "/login";
  }

  return input;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLocale = searchParams.get("locale");
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const redirectTo = sanitizeRedirect(searchParams.get("redirectTo"));
  const cookieStore = await cookies();

  cookieStore.set(localeCookieName, locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
