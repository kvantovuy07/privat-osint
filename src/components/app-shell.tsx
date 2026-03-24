import Link from "next/link";
import type { Role } from "@prisma/client";

import { logoutAction } from "@/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

type ShellProps = {
  children: React.ReactNode;
  current: "workspace" | "sources" | "dossiers" | "admin";
  currentPath: string;
  title: string;
  subtitle: string;
  user: {
    username: string;
    role: Role;
    queryUsedMonthly: number;
    queryLimitMonthly: number | null;
    queryUsedTotal: number;
    queryLimitTotal: number | null;
  };
  pendingRequestsCount?: number;
};

export async function AppShell({
  children,
  current,
  currentPath,
  title,
  subtitle,
  user,
  pendingRequestsCount = 0,
}: ShellProps) {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const navLinks = [
    { href: "/workspace", key: "workspace", label: dictionary.nav.workspace },
    { href: "/sources", key: "sources", label: dictionary.nav.sources },
    { href: "/dossiers", key: "dossiers", label: dictionary.nav.dossiers },
  ] as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,185,129,0.18),transparent_30%),linear-gradient(180deg,#030606_0%,#020303_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/5 bg-black/30 px-6 py-8 backdrop-blur">
          <div className="rounded-[1.75rem] border border-emerald-400/15 bg-emerald-400/6 p-5 shadow-[0_0_80px_rgba(16,185,129,0.05)]">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-200/70">
              {dictionary.common.appName}
            </p>
            <h1 className="mt-3 text-2xl font-semibold">{dictionary.common.workspaceName}</h1>
            <p className="mt-3 text-sm text-zinc-400">
              {locale === "ru"
                ? "Законный OSINT для исследования компаний, лидогенерации и due diligence."
                : "Lawful open-source intelligence for company research, lead signals, and due diligence."}
            </p>
          </div>

          <nav className="mt-8 grid gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`rounded-2xl px-4 py-3 text-sm transition ${
                  current === link.key
                    ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                    : "border border-transparent bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className={`rounded-2xl px-4 py-3 text-sm transition ${
                  current === "admin"
                    ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                    : "border border-transparent bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {dictionary.nav.admin} {pendingRequestsCount > 0 ? `(${pendingRequestsCount})` : ""}
              </Link>
            ) : null}
          </nav>

          <div className="mt-8 grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                {dictionary.common.operator}
              </p>
              <p className="mt-2 text-lg font-medium text-white">{user.username}</p>
              <p className="text-sm text-zinc-400">{user.role}</p>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-zinc-500">{dictionary.common.monthlyUsage}</p>
                <p className="mt-1 text-white">
                  {user.queryUsedMonthly}
                  {typeof user.queryLimitMonthly === "number"
                    ? ` / ${user.queryLimitMonthly}`
                    : ` / ${dictionary.common.unlimited}`}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-zinc-500">{dictionary.common.totalUsage}</p>
                <p className="mt-1 text-white">
                  {user.queryUsedTotal}
                  {typeof user.queryLimitTotal === "number"
                    ? ` / ${user.queryLimitTotal}`
                    : ` / ${dictionary.common.unlimited}`}
                </p>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                {dictionary.common.logOut}
              </button>
            </form>
          </div>
        </aside>

        <main className="px-6 py-8 md:px-8">
          <header className="mb-8 flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-black/25 px-6 py-5 backdrop-blur md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">
                {current}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">{subtitle}</p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <LanguageSwitcher currentPath={currentPath} />
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50/90">
                {dictionary.common.lawfulDisclaimer}
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
