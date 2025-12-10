// import { PrismaClient } from '../generated/prisma/client';
// const prisma = new PrismaClient()
import { prisma } from '../config/prisma.config';
async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: 'test@example.com',
    },
    create: {
      email: 'test@example.com',
    },
    update: {
      email: 'test@example.com',
    },
  });

  console.log(user);
}

main();
