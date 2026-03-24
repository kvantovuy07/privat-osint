import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function DossiersPage() {
  const user = await requireUser();
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
      title="Saved Dossiers"
      subtitle="Store the searches that matter and keep a compact analyst note beside each one for follow-up, outreach, or due diligence."
      user={user}
      pendingRequestsCount={pendingRequestsCount}
    >
      <div className="grid gap-4">
        {dossiers.length === 0 ? (
          <section className="panel">
            <p className="text-sm text-zinc-400">
              No dossiers saved yet. Run a search in the workspace and store the result from the
              dossier panel.
            </p>
          </section>
        ) : (
          dossiers.map((dossier) => (
            <article key={dossier.id} className="panel grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">{dossier.title}</h2>
                  <p className="text-sm text-zinc-500">
                    Updated{" "}
                    {new Intl.DateTimeFormat("en", {
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
                    Open raw snapshot
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
