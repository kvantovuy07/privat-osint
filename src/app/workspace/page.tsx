import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SearchConsole } from "@/components/search-console";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function WorkspacePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const pendingRequestsCount =
    user.role === "ADMIN"
      ? await prisma.accessRequest.count({ where: { status: "PENDING" } })
      : 0;

  return (
    <AppShell
      current="workspace"
      currentPath="/workspace"
      title={dictionary.workspacePage.title}
      subtitle={dictionary.workspacePage.subtitle}
      user={user}
      pendingRequestsCount={pendingRequestsCount}
    >
      <SearchConsole />
    </AppShell>
  );
}
