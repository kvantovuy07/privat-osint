"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import {
  createSession,
  destroySession,
  getCurrentUser,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeedAdmin } from "@/lib/ensure-seed-admin";
import { type ActionState } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await ensureSeedAdmin();

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return {
      status: "error",
      message: "Username and password are required.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await writeAuditLog({
      action: "LOGIN_FAILURE",
      details: { username },
    });

    return {
      status: "error",
      message: "Invalid credentials.",
    };
  }

  if (!user.isActive) {
    return {
      status: "error",
      message: "This account is disabled.",
    };
  }

  if (user.accessExpiresAt && user.accessExpiresAt < new Date()) {
    return {
      status: "error",
      message: "This account has expired.",
    };
  }

  await createSession(user.id);
  await writeAuditLog({
    action: "LOGIN_SUCCESS",
    actorUserId: user.id,
  });
  redirect("/workspace");
}

export async function logoutAction() {
  const user = await getCurrentUser();

  await destroySession();

  if (user) {
    await writeAuditLog({
      action: "LOGOUT",
      actorUserId: user.id,
    });
  }

  redirect("/login");
}

export async function requestAccessAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") || "").trim();
  const requestedUsername = String(formData.get("requestedUsername") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const comment = String(formData.get("comment") || "").trim();
  const headerStore = await headers();

  if (!name || !requestedUsername || !email || !reason) {
    return {
      status: "error",
      message: "Name, requested username, email, and reason are required.",
    };
  }

  await prisma.accessRequest.create({
    data: {
      name,
      requestedUsername,
      email,
      contact: contact || null,
      company: company || null,
      reason,
      comment: comment || null,
      ipAddress: headerStore.get("x-forwarded-for"),
    },
  });

  await writeAuditLog({
    action: "ACCESS_REQUEST_CREATED",
    details: {
      requestedUsername,
      email,
      company,
    },
  });

  return {
    status: "success",
    message: "Access request submitted. The administrator can now approve or reject it from the console.",
  };
}
