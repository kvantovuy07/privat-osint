import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import {
  CreateUserForm,
  ReviewRequestForm,
  UpdateUserForm,
} from "@/components/admin-forms";
import { getDateLocale, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { formatDate } from "@/lib/time";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const dateLocale = getDateLocale(locale);

  const [pendingRequests, users, auditLogs, queryLogs] = await Promise.all([
    prisma.accessRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        actorUser: true,
        targetUser: true,
      },
    }),
    prisma.queryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        user: true,
      },
    }),
  ]);

  return (
    <AppShell
      current="admin"
      currentPath="/admin"
      title={dictionary.adminPage.title}
      subtitle={dictionary.adminPage.subtitle}
      user={admin}
      pendingRequestsCount={pendingRequests.length}
    >
      <div className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <CreateUserForm />

          <section className="panel grid gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                {dictionary.adminPage.accessRequests}
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {dictionary.adminPage.pendingApproval}: {pendingRequests.length}
              </h2>
            </div>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-zinc-400">{dictionary.adminPage.noPending}</p>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <ReviewRequestForm key={request.id} request={request} />
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="panel grid gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
              {dictionary.adminPage.users}
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {dictionary.adminPage.accountsAndQuotas}
            </h2>
          </div>
          <div className="grid gap-4">
            {users.map((user) => (
              <div key={user.id} className="grid gap-3">
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <span>{dictionary.common.created} {formatDate(user.createdAt, dateLocale)}</span>
                  <span>{dictionary.common.expires} {formatDate(user.accessExpiresAt, dateLocale)}</span>
                  <span>
                    {dictionary.adminPage.monthly} {user.queryUsedMonthly}
                    {typeof user.queryLimitMonthly === "number"
                      ? ` / ${user.queryLimitMonthly}`
                      : ` / ${dictionary.common.unlimited}`}
                  </span>
                  <span>
                    {dictionary.adminPage.total} {user.queryUsedTotal}
                    {typeof user.queryLimitTotal === "number"
                      ? ` / ${user.queryLimitTotal}`
                      : ` / ${dictionary.common.unlimited}`}
                  </span>
                </div>
                <UpdateUserForm user={user} />
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="panel grid gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                {dictionary.adminPage.audit}
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {dictionary.adminPage.recentEvents}
              </h2>
            </div>
            <div className="grid gap-3">
              {auditLogs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{log.action}</p>
                    <span className="text-xs text-zinc-500">
                      {new Intl.DateTimeFormat(dateLocale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    {dictionary.common.actor}: {log.actorUser?.username || dictionary.common.system}
                    {log.targetUser ? ` • ${dictionary.common.target}: ${log.targetUser.username}` : ""}
                  </p>
                  {log.details ? (
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-300">
                      {log.details}
                    </pre>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="panel grid gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                {dictionary.adminPage.usage}
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {dictionary.adminPage.recentSearches}
              </h2>
            </div>
            <div className="grid gap-3">
              {queryLogs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{log.query}</p>
                    <span className="text-xs text-zinc-500">
                      {new Intl.DateTimeFormat(dateLocale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    {dictionary.common.user}: {log.user.username} • {dictionary.common.type}: {log.inferredType} • {dictionary.common.resultsSuffix}: {log.resultCount}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {dictionary.common.sources}: {log.sources || dictionary.common.noLiveSources}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
