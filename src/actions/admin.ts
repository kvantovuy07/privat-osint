"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { type ActionState } from "@/lib/form-state";
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
      message: "Username and password are required.",
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
      message: `User ${username} created.`,
    };
  } catch {
    return {
      status: "error",
      message: "Could not create the user. The username or email may already exist.",
    };
  }
}

export async function updateUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
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
      message: "User ID is missing.",
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
      message: `Updated ${updatedUser.username}.`,
    };
  } catch {
    return {
      status: "error",
      message: "Could not update this user.",
    };
  }
}

export async function reviewAccessRequestAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const accessRequestId = String(formData.get("accessRequestId") || "");
  const decision = String(formData.get("decision") || "");
  const reviewNote = String(formData.get("reviewNote") || "").trim();

  if (!accessRequestId || !decision) {
    return {
      status: "error",
      message: "Request and decision are required.",
    };
  }

  const accessRequest = await prisma.accessRequest.findUnique({
    where: { id: accessRequestId },
  });

  if (!accessRequest) {
    return {
      status: "error",
      message: "Access request not found.",
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
      message: `Rejected ${accessRequest.requestedUsername}.`,
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
      message: "Approval requires a username and password.",
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
      message: `Approved ${username} and created the account.`,
    };
  } catch {
    return {
      status: "error",
      message: "Could not approve the request. The username or email may already exist.",
    };
  }
}
