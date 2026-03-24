"use client";

import Link from "next/link";

import { useLocale } from "@/components/locale-provider";

export function LanguageSwitcher({
  currentPath,
}: {
  currentPath: string;
}) {
  const { locale, dictionary } = useLocale();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2 py-2 text-xs text-zinc-300 backdrop-blur">
      <span className="px-2 uppercase tracking-[0.25em] text-zinc-500">
        {dictionary.language.label}
      </span>
      {(["en", "ru"] as const).map((code) => {
        const active = locale === code;
        return (
          <Link
            key={code}
            href={`/api/locale?locale=${code}&redirectTo=${encodeURIComponent(currentPath)}`}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              active
                ? "bg-emerald-400 text-black"
                : "text-zinc-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            {dictionary.language[code]}
          </Link>
        );
      })}
    </div>
  );
}
