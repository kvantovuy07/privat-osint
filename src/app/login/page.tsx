import { LoginForm } from "@/components/auth-forms";
import { MatrixRain } from "@/components/matrix-rain";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-12">
      <MatrixRain />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),transparent_30%)]" />
      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-emerald-400/20 bg-black/65 p-8 shadow-[0_0_120px_rgba(16,185,129,0.1)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.45em] text-emerald-200/70">
          Privat OSINT
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Private Intelligence Workspace</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Search corporate entities, public code footprints, compliance sources, and B2B
          signals from one controlled console.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
