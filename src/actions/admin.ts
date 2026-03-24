"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { type ActionState } from "@/lib/form-state";
import { formatMessage, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { parseOptionalDate } from "@/lib/time";

function parseOptionalInt(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseRole(value: FormDataEntryValue | null) {
  return value === "ADMIN" || value === "ANALYST" || value === "VIEWER"
    ? value
    : "VIEWER";
}

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const dictionary = getDictionary(await getLocale());
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const role = parseRole(formData.get("role")) as Role;
  const accessExpiresAt = parseOptionalDate(formData.get("accessExpiresAt"));
  const queryLimitTotal = parseOptionalInt(formData.get("queryLimitTotal"));
  const queryLimitMonthly = parseOptionalInt(formData.get("queryLimitMonthly"));

  if (!username || !password) {
    return {
      status: "error",
      message: dictionary.actionMessages.usernamePasswordRequired,
    };
  }

  try {
    const createdUser = await prisma.user.create({
      data: {
        username,
        passwordHash: await hashPassword(password),
        name: name || null,
        email: email || null,
        role,
        isActive: true,
        accessExpiresAt,
        queryLimitTotal,
        queryLimitMonthly,
        monthlyWindowStartedAt: new Date(),
        createdById: admin.id,
      },
    });

    await writeAuditLog({
      action: "USER_CREATED",
      actorUserId: admin.id,
      targetUserId: createdUser.id,
      details: { username, role },
    });

    revalidatePath("/admin");

    return {
      status: "success",
      message: formatMessage(dictionary.actionMessages.userCreated, { username }),
    };
  } catch {
    return {
      status: "error",
      message: dictionary.actionMessages.userCreateFailed,
    };
  }
}

export async function updateUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const dictionary = getDictionary(await getLocale());
  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const role = parseRole(formData.get("role")) as Role;
  const accessExpiresAt = parseOptionalDate(formData.get("accessExpiresAt"));
  const queryLimitTotal = parseOptionalInt(formData.get("queryLimitTotal"));
  const queryLimitMonthly = parseOptionalInt(formData.get("queryLimitMonthly"));
  const isActive = String(formData.get("isActive") || "") === "on";

  if (!userId) {
    return {
      status: "error",
      message: dictionary.actionMessages.userIdMissing,
    };
  }

  const updates: {
    name: string | null;
    email: string | null;
    role: Role;
    isActive: boolean;
    accessExpiresAt: Date | null;
    queryLimitTotal: number | null;
    queryLimitMonthly: number | null;
    passwordHash?: string;
  } = {
    name: name || null,
    email: email || null,
    role,
    isActive,
    accessExpiresAt,
    queryLimitTotal,
    queryLimitMonthly,
  };

  if (password) {
    updates.passwordHash = await hashPassword(password);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    await writeAuditLog({
      action: "USER_UPDATED",
      actorUserId: admin.id,
      targetUserId: userId,
      details: { role, isActive },
    });

    revalidatePath("/admin");

    return {
      status: "success",
      message: formatMessage(dictionary.actionMessages.userUpdated, {
        username: updatedUser.username,
      }),
    };
  } catch {
    return {
      status: "error",
      message: dictionary.actionMessages.userUpdateFailed,
    };
  }
}

export async function reviewAccessRequestAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const dictionary = getDictionary(await getLocale());
  const accessRequestId = String(formData.get("accessRequestId") || "");
  const decision = String(formData.get("decision") || "");
  const reviewNote = String(formData.get("reviewNote") || "").trim();

  if (!accessRequestId || !decision) {
    return {
      status: "error",
      message: dictionary.actionMessages.requestDecisionRequired,
    };
  }

  const accessRequest = await prisma.accessRequest.findUnique({
    where: { id: accessRequestId },
  });

  if (!accessRequest) {
    return {
      status: "error",
      message: dictionary.actionMessages.accessRequestNotFound,
    };
  }

  if (decision === "REJECT") {
    await prisma.accessRequest.update({
      where: { id: accessRequestId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
        reviewNote: reviewNote || null,
      },
    });

    await writeAuditLog({
      action: "ACCESS_REQUEST_REJECTED",
      actorUserId: admin.id,
      targetAccessRequestId: accessRequestId,
      details: { requestedUsername: accessRequest.requestedUsername },
    });

    revalidatePath("/admin");

    return {
      status: "success",
      message: formatMessage(dictionary.actionMessages.accessRequestRejected, {
        username: accessRequest.requestedUsername,
      }),
    };
  }

  const username =
    String(formData.get("username") || "").trim() || accessRequest.requestedUsername;
  const password = String(formData.get("password") || "");
  const role = parseRole(formData.get("role")) as Role;
  const accessExpiresAt = parseOptionalDate(formData.get("accessExpiresAt"));
  const queryLimitTotal = parseOptionalInt(formData.get("queryLimitTotal"));
  const queryLimitMonthly = parseOptionalInt(formData.get("queryLimitMonthly"));

  if (!username || !password) {
    return {
      status: "error",
      message: dictionary.actionMessages.approvalRequiresCredentials,
    };
  }

  try {
    const createdUser = await prisma.user.create({
      data: {
        username,
        passwordHash: await hashPassword(password),
        name: accessRequest.name,
        email: accessRequest.email,
        role,
        isActive: true,
        accessExpiresAt,
        queryLimitTotal,
        queryLimitMonthly,
        monthlyWindowStartedAt: new Date(),
        createdById: admin.id,
      },
    });

    await prisma.accessRequest.update({
      where: { id: accessRequestId },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
        reviewNote: reviewNote || null,
        approvedUserId: createdUser.id,
      },
    });

    await writeAuditLog({
      action: "ACCESS_REQUEST_APPROVED",
      actorUserId: admin.id,
      targetUserId: createdUser.id,
      targetAccessRequestId: accessRequestId,
      details: { username, role },
    });

    revalidatePath("/admin");

    return {
      status: "success",
      message: formatMessage(dictionary.actionMessages.accessRequestApproved, {
        username,
      }),
    };
  } catch {
    return {
      status: "error",
      message: dictionary.actionMessages.accessRequestApprovalFailed,
    };
  }
}
