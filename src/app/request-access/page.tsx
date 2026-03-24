import Link from "next/link";

import { AccessRequestForm } from "@/components/auth-forms";
import { MatrixRain } from "@/components/matrix-rain";

export default function RequestAccessPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-12">
      <MatrixRain />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_35%)]" />
      <section className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-white/10 bg-black/70 p-8 shadow-[0_0_120px_rgba(16,185,129,0.08)] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-emerald-200/70">
              Access Intake
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Подать заявку на доступ</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">
              Access requests are reviewed inside the administrator cabinet. Approved users can
              receive time-bound access and query quotas.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            Back to login
          </Link>
        </div>
        <div className="mt-8">
          <AccessRequestForm />
        </div>
      </section>
    </main>
  );
}
