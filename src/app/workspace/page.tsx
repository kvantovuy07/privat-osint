import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SearchConsole } from "@/components/search-console";

export default async function WorkspacePage() {
  const user = await requireUser();
  const pendingRequestsCount =
    user.role === "ADMIN"
      ? await prisma.accessRequest.count({ where: { status: "PENDING" } })
      : 0;

  return (
    <AppShell
      current="workspace"
      title="Unified Search Console"
      subtitle="Start with one search bar, then pivot through phone enrichment, registries, SEC references, Wayback history, DNS, RDAP, SEO metadata, GitHub footprints, and deployable username intelligence."
      user={user}
      pendingRequestsCount={pendingRequestsCount}
    >
      <SearchConsole />
    </AppShell>
  );
}
