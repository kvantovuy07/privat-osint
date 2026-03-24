import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "privat-osint-session";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const cookieStore = await cookies();
  const headerStore = await headers();
  const expiresAt = getSessionExpiry();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      ipAddress: headerStore.get("x-forwarded-for"),
      userAgent: headerStore.get("user-agent"),
    },
  });

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: sha256(sessionToken),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash = sha256(sessionToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    if (session) {
      await prisma.session.delete({ where: { tokenHash } });
    }
    return null;
  }

  await prisma.session.update({
    where: { tokenHash },
    data: { lastSeenAt: new Date() },
  });

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== Role.ADMIN) {
    redirect("/workspace");
  }

  return user;
}
