import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pin = "1234";
  const pinHash = await bcrypt.hash(pin, 12);
  
  const updated = await prisma.farmerProfile.update({
    where: { id: "6c5cb34e-86fa-4bd4-b747-361c3e6cf10e" },
    data: {
      pinHash,
      failedAttempts: 0,
      isLocked: false,
      lockedUntil: null
    }
  });
  
  console.log("UPDATED FARMER:", updated.name, "with plain PIN:", pin);
}

main().catch(err => {
  console.error(err);
});
