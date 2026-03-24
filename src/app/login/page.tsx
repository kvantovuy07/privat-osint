import { LoginForm } from "@/components/auth-forms";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MatrixRain } from "@/components/matrix-rain";
import { ensureSeedAdmin } from "@/lib/ensure-seed-admin";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function LoginPage() {
  await ensureSeedAdmin();
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-12">
      <MatrixRain />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),transparent_30%)]" />
      <div className="absolute right-6 top-6 z-20">
        <LanguageSwitcher currentPath="/login" />
      </div>
      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-emerald-400/20 bg-black/65 p-8 shadow-[0_0_120px_rgba(16,185,129,0.1)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.45em] text-emerald-200/70">
          {dictionary.common.appName}
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">{dictionary.loginPage.title}</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          {dictionary.loginPage.description}
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
