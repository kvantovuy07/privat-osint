import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const username = process.env.SEED_ADMIN_USERNAME || "Mentor";
const password = process.env.SEED_ADMIN_PASSWORD || "Mentor07@";

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      accessExpiresAt: null,
      queryLimitMonthly: null,
      queryLimitTotal: null,
    },
    create: {
      username,
      name: "Primary Administrator",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      monthlyWindowStartedAt: new Date(),
    },
  });

  console.log(`Seeded admin account: ${username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
