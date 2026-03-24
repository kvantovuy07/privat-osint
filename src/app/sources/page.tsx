import { connectorCatalog } from "@/lib/osint/catalog";
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
        {grouped.map(([category, connectors]) => (
          <section key={category} className="panel grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                {category}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {category} {dictionary.sourcesPage.sourcesSuffix}
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
                      {connector.category}
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
                        {kind}
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
