import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const farmers = await prisma.farmerProfile.findMany({
    select: {
      id: true,
      name: true,
      pinHash: true,
      isActive: true
    }
  });
  console.log("ALL FARMERS:", JSON.stringify(farmers, null, 2));
}

main().catch(err => {
  console.error(err);
});
