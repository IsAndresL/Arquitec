import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getUserId() {
  const user = await prisma.user.findFirst();
  console.log(user?.id);
}
getUserId();
