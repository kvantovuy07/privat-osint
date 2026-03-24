import "server-only";

import { prisma } from "@/lib/prisma";
import { getMonthWindowStart, isSameMonthWindow } from "@/lib/time";

export async function getSearchableUserState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!isSameMonthWindow(user.monthlyWindowStartedAt)) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        monthlyWindowStartedAt: getMonthWindowStart(),
        queryUsedMonthly: 0,
      },
    });
  }

  return user;
}

export async function ensureUserCanSearch(userId: string) {
  const user = await getSearchableUserState(userId);
  const now = new Date();

  if (!user.isActive) {
    throw new Error("Account is disabled");
  }

  if (user.accessExpiresAt && user.accessExpiresAt < now) {
    throw new Error("Account access has expired");
  }

  if (
    typeof user.queryLimitTotal === "number" &&
    user.queryUsedTotal >= user.queryLimitTotal
  ) {
    throw new Error("Total query limit reached");
  }

  if (
    typeof user.queryLimitMonthly === "number" &&
    user.queryUsedMonthly >= user.queryLimitMonthly
  ) {
    throw new Error("Monthly query limit reached");
  }

  return user;
}

export async function incrementUserSearchUsage(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      queryUsedTotal: { increment: 1 },
      queryUsedMonthly: { increment: 1 },
      monthlyWindowStartedAt: getMonthWindowStart(),
    },
  });
}
