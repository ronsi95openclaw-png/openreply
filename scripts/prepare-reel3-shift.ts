import { prisma } from "../lib/db/client";
import { prepareReel3Shift, type Reel3Database } from "../lib/reel3-shift/commands";
import { generateReportShareSlug } from "../lib/reports/share";
import { generateTrackedLinkSlug } from "../lib/tracking/server";

async function main() {
  const result = await prepareReel3Shift({
    database: prisma as unknown as Reel3Database,
    requestedAccount: process.env.INSTAGRAM_ACCOUNT_ID,
    origin: process.env.NEXTAUTH_URL,
    generateReportShareSlug,
    generateTrackedLinkSlug,
  });
  console.log(JSON.stringify(result));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
