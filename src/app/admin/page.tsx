import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import {
  CreateUserForm,
  ReviewRequestForm,
  UpdateUserForm,
} from "@/components/admin-forms";
import { formatDate } from "@/lib/time";

export default async function AdminPage() {
  const admin = await requireAdmin();

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
      title="Administrator Cabinet"
      subtitle="Approve or reject access requests, provision analysts, edit quotas, and watch the operational audit trail from one private console."
      user={admin}
      pendingRequestsCount={pendingRequests.length}
    >
      <div className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <CreateUserForm />

          <section className="panel grid gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                Access Requests
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Pending approval: {pendingRequests.length}
              </h2>
            </div>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No pending access requests. New submissions will appear here and can be approved
                into real user accounts.
              </p>
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
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Users</p>
            <h2 className="text-2xl font-semibold text-white">Accounts and quotas</h2>
          </div>
          <div className="grid gap-4">
            {users.map((user) => (
              <div key={user.id} className="grid gap-3">
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <span>Created {formatDate(user.createdAt)}</span>
                  <span>Expires {formatDate(user.accessExpiresAt)}</span>
                  <span>
                    Monthly {user.queryUsedMonthly}
                    {typeof user.queryLimitMonthly === "number"
                      ? ` / ${user.queryLimitMonthly}`
                      : " / unlimited"}
                  </span>
                  <span>
                    Total {user.queryUsedTotal}
                    {typeof user.queryLimitTotal === "number"
                      ? ` / ${user.queryLimitTotal}`
                      : " / unlimited"}
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
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Audit</p>
              <h2 className="text-2xl font-semibold text-white">Recent admin and auth events</h2>
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
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Actor: {log.actorUser?.username || "system"}
                    {log.targetUser ? ` • Target: ${log.targetUser.username}` : ""}
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
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Usage</p>
              <h2 className="text-2xl font-semibold text-white">Recent searches</h2>
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
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    User: {log.user.username} • Type: {log.inferredType} • Results: {log.resultCount}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Sources: {log.sources || "No live sources"}
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
