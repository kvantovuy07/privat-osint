import "server-only";

import { prisma } from "@/lib/prisma";
import { safeJson } from "@/lib/serialize";

type AuditInput = {
  action: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  targetAccessRequestId?: string | null;
  details?: unknown;
};

export async function writeAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      targetUserId: input.targetUserId ?? null,
      targetAccessRequestId: input.targetAccessRequestId ?? null,
      details: input.details ? safeJson(input.details) : null,
    },
  });
}
