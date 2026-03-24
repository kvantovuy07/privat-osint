"use client";

import { createContext, useContext } from "react";

import {
  getDictionary,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  dictionary: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  dictionary: getDictionary("en"),
});

export function LocaleProvider({
  children,
  locale,
  dictionary,
}: {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <LocaleContext.Provider value={{ locale, dictionary }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
