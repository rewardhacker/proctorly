const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.TUTOR_EMAIL;
  const password = process.env.TUTOR_PASSWORD;
  if (!email || !password) {
    throw new Error("Set TUTOR_EMAIL and TUTOR_PASSWORD in .env before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const tutor = await prisma.tutor.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Tutor" },
  });

  console.log(`Tutor account ready: ${tutor.email}`);
}

main().finally(() => prisma.$disconnect());
