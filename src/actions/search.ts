"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { type ActionState, type SearchActionState } from "@/lib/form-state";
import { runUnifiedSearch, type SearchRun } from "@/lib/osint/catalog";
import { prisma } from "@/lib/prisma";
import { ensureUserCanSearch, incrementUserSearchUsage } from "@/lib/quotas";

export async function runSearchAction(
  _prevState: SearchActionState<SearchRun>,
  formData: FormData,
): Promise<SearchActionState<SearchRun>> {
  const user = await requireUser();
  const query = String(formData.get("query") || "").trim();

  if (!query) {
    return {
      status: "error",
      message: "Enter a company, domain, username, repository, person, or keyword.",
      result: null,
    };
  }

  try {
    await ensureUserCanSearch(user.id);
    const result = await runUnifiedSearch(query);
    await incrementUserSearchUsage(user.id);

    await prisma.queryLog.create({
      data: {
        userId: user.id,
        query,
        inferredType: result.inferredType,
        sources: result.usedSources.join(", "),
        resultCount: result.sections.reduce((count, section) => count + section.items.length, 0),
        status: "success",
      },
    });

    await writeAuditLog({
      action: "SEARCH_EXECUTED",
      actorUserId: user.id,
      details: { query, inferredType: result.inferredType },
    });

    return {
      status: "success",
      message: `Search completed across ${result.usedSources.length || 0} live sources.`,
      result,
    };
  } catch (error) {
    await prisma.queryLog.create({
      data: {
        userId: user.id,
        query,
        inferredType: "unknown",
        sources: "",
        resultCount: 0,
        status: "error",
      },
    });

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Search failed.",
      result: null,
    };
  }
}

export async function saveDossierAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const snapshot = String(formData.get("snapshot") || "");

  if (!title || !snapshot) {
    return {
      status: "error",
      message: "A title and search snapshot are required to save a dossier.",
    };
  }

  await prisma.dossier.create({
    data: {
      ownerId: user.id,
      title,
      description: description || null,
      querySnapshot: snapshot,
    },
  });

  await writeAuditLog({
    action: "DOSSIER_SAVED",
    actorUserId: user.id,
    details: { title },
  });

  revalidatePath("/dossiers");

  return {
    status: "success",
    message: "Dossier saved to your cabinet.",
  };
}
