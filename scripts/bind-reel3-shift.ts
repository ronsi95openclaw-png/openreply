import { prisma } from "../lib/db/client";
import { bindReel3ShiftCampaign, type Reel3Database } from "../lib/reel3-shift/commands";
import { canonicalReelUrl } from "../lib/reel3-shift/campaign";
import { getUserMedia } from "../lib/meta/client";
import { decryptToken } from "../lib/meta/oauth";

async function main() {
  const result = await bindReel3ShiftCampaign({
    database: prisma as unknown as Reel3Database,
    requestedAccount: process.env.INSTAGRAM_ACCOUNT_ID,
    origin: process.env.NEXTAUTH_URL ?? "",
    expectedPostUrl: canonicalReelUrl(process.env.REEL3_POST_URL ?? ""),
    recentReels: (account) => getUserMedia(decryptToken(account.accessToken), 25),
  });
  console.log(JSON.stringify({ status: "bound", ...result, active: true }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
