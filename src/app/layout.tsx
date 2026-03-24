import type { Metadata } from "next";
import { Azeret_Mono, Space_Grotesk } from "next/font/google";

import { LocaleProvider } from "@/components/locale-provider";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const mono = Azeret_Mono({
  variable: "--font-azeret-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Privat OSINT",
  description: "Private OSINT workspace for lawful corporate intelligence and B2B signal mapping.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={locale} dictionary={dictionary}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
