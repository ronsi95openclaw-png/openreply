import { prisma } from "../lib/db/client";
import {
  publicOrigin,
  repairStagedShiftLink,
  selectExactInstagramAccount,
  SHIFT_CAMPAIGN_NAME,
  SHIFT_KEYWORD,
} from "../lib/reel3-shift/campaign";

type Reel3Account = { id: string; instagramId: string };

async function main() {
  const accounts = await prisma.instagramAccount.findMany({ orderBy: { connectedAt: "desc" } });
  const account = selectExactInstagramAccount(
    accounts as Reel3Account[],
    process.env.INSTAGRAM_ACCOUNT_ID
  );
  const origin = publicOrigin(process.env.NEXTAUTH_URL);
  const result = await repairStagedShiftLink({
    campaigns: await prisma.automation.findMany({
      where: {
        instagramAccountId: account.id,
        OR: [{ name: SHIFT_CAMPAIGN_NAME }, { keywords: { has: SHIFT_KEYWORD } }],
      },
      include: { trackedLinks: { orderBy: { createdAt: "asc" } } },
    }),
    accountId: account.id,
    legacyDestination: `${origin}/shift-handoff-prompt`,
    canonicalDestination: `${origin}/shift-handoff`,
    updateDestination: async (linkId, destinationUrl) => {
      await prisma.trackedLink.update({ where: { id: linkId }, data: { destinationUrl } });
    },
  });

  console.log(JSON.stringify(result));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
