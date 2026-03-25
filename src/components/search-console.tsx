"use client";

import { useActionState } from "react";

import { useLocale } from "@/components/locale-provider";
import { runSearchAction, saveDossierAction } from "@/actions/search";
import { PendingButton } from "@/components/pending-button";
import { emptyActionState } from "@/lib/form-state";

const initialSearchState = {
  status: "idle" as const,
  message: "",
  result: null,
};

function formatItemType(type: string) {
  return type
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function deriveDataTypes(
  item: {
    source: string;
    type: string;
    title: string;
    subtitle?: string;
    description?: string;
    tags?: string[];
    dataTypes?: string[];
    details?: Array<{ label: string; value: string }>;
  },
  locale: "en" | "ru",
) {
  if (item.dataTypes?.length) {
    return item.dataTypes;
  }

  const haystack = [
    item.source,
    item.type,
    item.title,
    item.subtitle || "",
    item.description || "",
    ...(item.tags || []),
    ...((item.details || []).flatMap((detail) => [detail.label, detail.value])),
  ]
    .join(" ")
    .toLowerCase();

  const labels = [
    {
      pattern: /(email|mail|gravatar|avatar|local part|homepage emails)/i,
      value: locale === "ru" ? "Email" : "Email",
    },
    {
      pattern: /(phone|телефон|calling code|national format|homepage phones)/i,
      value: locale === "ru" ? "Телефон" : "Phone",
    },
    {
      pattern: /(name|person|имя|фамилия|initials)/i,
      value: locale === "ru" ? "Имя" : "Name",
    },
    {
      pattern: /(username|profile|handle|followers|following|public repos)/i,
      value: locale === "ru" ? "Профиль" : "Profile",
    },
    {
      pattern: /(github|repository|repo|stars|language)/i,
      value: locale === "ru" ? "Код / репозиторий" : "Code / Repository",
    },
    {
      pattern: /(company|registry|jurisdiction|lei|cik|ticker|officer|incorporation)/i,
      value: locale === "ru" ? "Компания / реестр" : "Company / Registry",
    },
    {
      pattern: /(domain|dns|rdap|nameserver|subdomain|certificate|security\.txt|robots|sitemap|canonical)/i,
      value: locale === "ru" ? "Домен / инфраструктура" : "Domain / Infrastructure",
    },
    {
      pattern: /(\bip\b|dns-a|dns-aaaa|cname)/i,
      value: locale === "ru" ? "IP / сеть" : "IP / Network",
    },
    {
      pattern: /(seo|metadata|title length|description length|h1|social links)/i,
      value: "SEO",
    },
    {
      pattern: /(archive|wayback|capture|historical)/i,
      value: locale === "ru" ? "Архив" : "Archive",
    },
    {
      pattern: /(partner|integration|ecosystem|collaboration|collab|external domains)/i,
      value: locale === "ru" ? "Партнёрства" : "Partnerships",
    },
    {
      pattern: /(contact|contacts|policy|email|phone|social)/i,
      value: locale === "ru" ? "Контакты" : "Contacts",
    },
    {
      pattern: /(statistics|score|record count|pages|followers|updated|count)/i,
      value: locale === "ru" ? "Статистика" : "Statistics",
    },
  ];

  return uniqueValues(
    labels.filter((entry) => entry.pattern.test(haystack)).map((entry) => entry.value),
  ).slice(0, 5);
}

function SearchStateNotice({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`rounded-2xl border px-4 py-3 text-sm ${
        status === "error"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      }`}
    >
      {message}
    </p>
  );
}

export function SearchConsole() {
  const { dictionary, locale } = useLocale();
  const [searchState, searchAction] = useActionState(
    runSearchAction,
    initialSearchState,
  );
  const [saveState, saveAction] = useActionState(
    saveDossierAction,
    emptyActionState,
  );

  return (
    <div className="grid gap-6">
      <form action={searchAction} className="panel grid gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">
            {dictionary.searchConsole.eyebrow}
          </p>
          <h1 className="text-3xl font-semibold text-white md:text-5xl">
            {dictionary.searchConsole.title}
          </h1>
          <p className="max-w-3xl text-sm text-zinc-400 md:text-base">
            {dictionary.searchConsole.description}
          </p>
        </div>
        <div className="relative">
          <input
            name="query"
            required
            placeholder={dictionary.searchConsole.placeholder}
            className="h-16 w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-6 text-lg text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/60 focus:bg-white/7"
          />
        </div>
        <SearchStateNotice status={searchState.status} message={searchState.message} />
        <div className="flex flex-wrap gap-3 text-sm">
          <PendingButton
            label={dictionary.searchConsole.run}
            pendingLabel={dictionary.searchConsole.running}
            className="rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <span className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-400">
            {dictionary.searchConsole.searchPaths}
          </span>
        </div>
      </form>

      {searchState.result ? (
        <section className="grid gap-6">
          <div className="panel grid gap-4 md:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                  {dictionary.searchConsole.snapshot}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {searchState.result.query}
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {searchState.result.summary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2">
                {searchState.result.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                  >
                    {warning}
                  </p>
                ))}
              </div>
            </div>

            <form action={saveAction} className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5">
              <input
                type="hidden"
                name="snapshot"
                value={JSON.stringify(searchState.result, null, 2)}
              />
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                  {dictionary.searchConsole.dossierEyebrow}
                </p>
                <h3 className="text-xl font-semibold text-white">
                  {dictionary.searchConsole.saveTitle}
                </h3>
                <p className="text-sm text-zinc-400">
                  {dictionary.searchConsole.saveDescription}
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  name="title"
                  defaultValue={`${searchState.result.query} ${
                    dictionary.searchConsole.dossierEyebrow.toLowerCase()
                  }`}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
                />
                <textarea
                  name="description"
                  rows={4}
                  placeholder={dictionary.searchConsole.dossierPlaceholder}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
                />
                <SearchStateNotice status={saveState.status} message={saveState.message} />
                <PendingButton
                  label={dictionary.searchConsole.save}
                  pendingLabel={dictionary.searchConsole.saving}
                  className="rounded-xl bg-white/10 px-4 py-3 font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </form>
          </div>

          <div className="grid gap-4">
            {searchState.result.sections.map((section) => (
              <section key={section.id} className="panel grid gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-zinc-400">
                      {section.items.length} {dictionary.common.resultsSuffix}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{section.description}</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {section.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-black/25 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-200">
                          {item.source}
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          {formatItemType(item.type)}
                        </span>
                      </div>
                      <h4 className="mt-3 text-lg font-medium text-white">{item.title}</h4>
                      {item.subtitle ? (
                        <p className="mt-1 text-sm text-emerald-100/80">{item.subtitle}</p>
                      ) : null}
                      {item.description ? (
                        <p className="mt-3 text-sm text-zinc-300">{item.description}</p>
                      ) : null}
                      {item.tags?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={`${item.id}-${tag}`}
                              className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {deriveDataTypes(item, locale).length ? (
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                            {locale === "ru" ? "Типы данных" : "Data Types"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {deriveDataTypes(item, locale).map((dataType) => (
                              <span
                                key={`${item.id}-${dataType}`}
                                className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-xs text-sky-100"
                              >
                                {dataType}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {item.details?.length ? (
                        <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
                          {item.details.map((detail) => (
                            <div
                              key={`${item.id}-${detail.label}`}
                              className="flex flex-wrap justify-between gap-2 text-sm"
                            >
                              <span className="text-zinc-500">{detail.label}</span>
                              <span className="text-right text-zinc-200">{detail.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm text-emerald-200 transition hover:text-emerald-100"
                        >
                          {dictionary.common.openSourceRecord}
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
