import "server-only";

import { Role } from "@prisma/client";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

let seedAttempted = false;

export async function ensureSeedAdmin() {
  if (seedAttempted) {
    return;
  }

  seedAttempted = true;

  const username = process.env.SEED_ADMIN_USERNAME || "Mentor";
  const password = process.env.SEED_ADMIN_PASSWORD || "Mentor07@";

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await prisma.user.create({
    data: {
      username,
      name: "Primary Administrator",
      passwordHash: await hashPassword(password),
      role: Role.ADMIN,
      isActive: true,
      monthlyWindowStartedAt: new Date(),
    },
  });
}
