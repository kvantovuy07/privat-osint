import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getDateLocale, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function DossiersPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const dateLocale = getDateLocale(locale);
  const pendingRequestsCount =
    user.role === "ADMIN"
      ? await prisma.accessRequest.count({ where: { status: "PENDING" } })
      : 0;

  const dossiers = await prisma.dossier.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppShell
      current="dossiers"
      currentPath="/dossiers"
      title={dictionary.dossiersPage.title}
      subtitle={dictionary.dossiersPage.subtitle}
      user={user}
      pendingRequestsCount={pendingRequestsCount}
    >
      <div className="grid gap-4">
        {dossiers.length === 0 ? (
          <section className="panel">
            <p className="text-sm text-zinc-400">{dictionary.dossiersPage.empty}</p>
          </section>
        ) : (
          dossiers.map((dossier) => (
            <article key={dossier.id} className="panel grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">{dossier.title}</h2>
                  <p className="text-sm text-zinc-500">
                    {dictionary.common.updated}{" "}
                    {new Intl.DateTimeFormat(dateLocale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(dossier.updatedAt)}
                  </p>
                </div>
              </div>
              {dossier.description ? (
                <p className="text-sm text-zinc-300">{dossier.description}</p>
              ) : null}
              {dossier.querySnapshot ? (
                <details className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <summary className="cursor-pointer text-sm text-emerald-200">
                    {dictionary.common.openRawSnapshot}
                  </summary>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs text-zinc-300">
                    {dossier.querySnapshot}
                  </pre>
                </details>
              ) : null}
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}
