import { prisma } from "../lib/db/client";
import { repairReel3ShiftLink, type Reel3Database } from "../lib/reel3-shift/commands";

async function main() {
  const result = await repairReel3ShiftLink({
    database: prisma as unknown as Reel3Database,
    requestedAccount: process.env.INSTAGRAM_ACCOUNT_ID,
    origin: process.env.NEXTAUTH_URL ?? "",
  });
  console.log(JSON.stringify(result));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
