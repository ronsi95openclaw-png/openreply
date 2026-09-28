import { prisma } from "../lib/db/client";
import {
  bindStagedShiftCampaign,
  canonicalReelUrl,
  publicOrigin,
  selectExactInstagramAccount,
  SHIFT_CAMPAIGN_NAME,
  SHIFT_KEYWORD,
} from "../lib/reel3-shift/campaign";
import { getUserMedia } from "../lib/meta/client";
import { decryptToken } from "../lib/meta/oauth";

type Reel3Account = { id: string; instagramId: string; accessToken: string };

async function main() {
  const expectedPostUrl = canonicalReelUrl(process.env.REEL3_POST_URL ?? "");
  const accounts = await prisma.instagramAccount.findMany({ orderBy: { connectedAt: "desc" } });
  const account = selectExactInstagramAccount(
    accounts as Reel3Account[],
    process.env.INSTAGRAM_ACCOUNT_ID
  );
  const result = await bindStagedShiftCampaign({
    campaigns: await prisma.automation.findMany({
      where: {
        instagramAccountId: account.id,
        OR: [{ name: SHIFT_CAMPAIGN_NAME }, { keywords: { has: SHIFT_KEYWORD } }],
      },
      include: { trackedLinks: { orderBy: { createdAt: "asc" } } },
    }),
    accountId: account.id,
    canonicalDestination: `${publicOrigin(process.env.NEXTAUTH_URL)}/shift-handoff`,
    expectedPostUrl,
    recentReels: () => getUserMedia(decryptToken(account.accessToken), 25),
    activate: async (campaignId, reelId, reelUrl) => {
      await prisma.automation.update({
        where: { id: campaignId },
        data: { postId: reelId, postUrl: reelUrl, pendingNextReel: false, isActive: true },
      });
    },
  });

  console.log(JSON.stringify({ status: "bound", ...result, active: true }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
