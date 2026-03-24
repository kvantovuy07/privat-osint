import {
  connectorCatalog,
  getHeavyToolGuides,
  humanizeConnectorCategory,
  humanizeQueryKind,
} from "@/lib/osint/catalog";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function SourcesPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const pendingRequestsCount =
    user.role === "ADMIN"
      ? await prisma.accessRequest.count({ where: { status: "PENDING" } })
      : 0;

  const grouped = Object.entries(
    connectorCatalog.reduce<Record<string, typeof connectorCatalog>>((acc, connector) => {
      acc[connector.category] = [...(acc[connector.category] || []), connector];
      return acc;
    }, {}),
  );
  const heavyGuides = getHeavyToolGuides(locale);

  return (
    <AppShell
      current="sources"
      currentPath="/sources"
      title={dictionary.sourcesPage.title}
      subtitle={dictionary.sourcesPage.subtitle}
      user={user}
      pendingRequestsCount={pendingRequestsCount}
    >
      <div className="grid gap-6">
        <section className="panel grid gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
              {locale === "ru" ? "Heavy OSINT" : "Heavy OSINT"}
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {locale === "ru"
                ? "Подключение Sherlock, Maigret, SpiderFoot и других глубинных движков"
                : "Connecting Sherlock, Maigret, SpiderFoot, and other depth engines"}
            </h2>
            <p className="max-w-4xl text-sm text-zinc-400">
              {locale === "ru"
                ? "Нативные HTTP-источники уже работают прямо в сайте. Тяжёлые OSINT-инструменты лучше держать в отдельном worker-слое, а сайт будет автоматически подтягивать их результаты обратно в общую выдачу."
                : "Native HTTP sources already run directly inside the site. Heavy OSINT tools work best as a separate worker layer, and the site can automatically pull their results back into unified search."}
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {heavyGuides.map((guide) => (
              <article
                key={guide.id}
                className="rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.3em] ${
                      guide.configured
                        ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                        : "border border-amber-300/20 bg-amber-300/10 text-amber-100"
                    }`}
                  >
                    {guide.configured
                      ? locale === "ru"
                        ? "подключён"
                        : "wired"
                      : locale === "ru"
                        ? "ожидает worker"
                        : "needs worker"}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {guide.queryKinds.map((kind) => humanizeQueryKind(kind, locale)).join(" • ")}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-medium text-white">{guide.name}</h3>
                <p className="mt-3 text-sm text-zinc-300">{guide.description}</p>
                <p className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
                  {guide.connectionStatus}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-zinc-400">
                  <p>{guide.usageHint}</p>
                  <p>
                    <span className="text-zinc-500">
                      {locale === "ru" ? "Bridge URL" : "Bridge URL"}:
                    </span>{" "}
                    <code>{guide.urlEnv}</code>
                  </p>
                  <p>
                    <span className="text-zinc-500">
                      {locale === "ru" ? "Bridge token" : "Bridge token"}:
                    </span>{" "}
                    <code>{guide.tokenEnv}</code>
                    {guide.tokenConfigured ? (
                      <span className="ml-2 text-emerald-200">
                        {locale === "ru" ? "настроен" : "set"}
                      </span>
                    ) : null}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
            <p className="font-medium text-white">
              {locale === "ru" ? "Как это использовать" : "How to use it"}
            </p>
            <div className="mt-3 grid gap-2 text-zinc-400">
              <p>
                {locale === "ru"
                  ? "1. Поднимите worker из папки `workers/heavy-osint` на VPS, Render, Fly.io или Railway."
                  : "1. Deploy the worker from `workers/heavy-osint` to a VPS, Render, Fly.io, or Railway."}
              </p>
              <p>
                {locale === "ru"
                  ? "2. На worker-хосте задайте `OSINT_WORKER_TOKEN` и команды для нужных инструментов."
                  : "2. Set `OSINT_WORKER_TOKEN` and the command paths for the tools you want on the worker host."}
              </p>
              <p>
                {locale === "ru"
                  ? "3. В основном приложении укажите bridge URL и token env. После этого поиск по username, человеку, компании или домену начнёт автоматически подтягивать тяжёлые результаты."
                  : "3. Set the bridge URL and token env vars in the main app. After that, searches for usernames, people, companies, or domains will automatically pull heavy-tool results into unified search."}
              </p>
            </div>
          </div>
        </section>

        {grouped.map(([category, connectors]) => (
          <section key={category} className="panel grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                {humanizeConnectorCategory(category, locale)}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {humanizeConnectorCategory(category, locale)} {dictionary.sourcesPage.sourcesSuffix}
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {connectors.map((connector) => (
                <article
                  key={connector.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.3em] ${
                        connector.status === "live"
                            ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                          : connector.status === "ready"
                            ? "border border-sky-400/20 bg-sky-400/10 text-sky-200"
                            : connector.status === "requires_key"
                              ? "border border-amber-300/20 bg-amber-300/10 text-amber-100"
                              : "border border-white/10 bg-white/5 text-zinc-300"
                      }`}
                    >
                      {connector.status === "live"
                        ? dictionary.sourcesPage.live
                        : connector.status === "ready"
                          ? dictionary.sourcesPage.ready
                          : connector.status === "requires_key"
                            ? dictionary.sourcesPage.requiresKey
                            : dictionary.sourcesPage.manual}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {humanizeConnectorCategory(connector.category, locale)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-white">{connector.name}</h3>
                  <p className="mt-3 text-sm text-zinc-300">{connector.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {connector.queryKinds.map((kind) => (
                      <span
                        key={`${connector.id}-${kind}`}
                        className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-400"
                      >
                        {humanizeQueryKind(kind, locale)}
                      </span>
                    ))}
                  </div>
                  {connector.notes ? (
                    <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-400">
                      {connector.notes}
                    </p>
                  ) : null}
                  <a
                    href={connector.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm text-emerald-200 transition hover:text-emerald-100"
                  >
                    {dictionary.common.openOfficialSource}
                  </a>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
