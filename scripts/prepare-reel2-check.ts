import { prisma } from "../lib/db/client";
import { generateReportShareSlug } from "../lib/reports/share";
import { generateTrackedLinkSlug } from "../lib/tracking/server";

const campaignName = "Pour&Prompt — Reel 2 Daily Ops Check";
const keyword = "CHECK";
const dmMessage =
  "Got it—here's the Pour&Prompt Daily Ops Check. Enter yesterday's numbers, review what needs attention, then copy the prepared prompt into ChatGPT. Tap below to download it: {link}";
const publicReplies = [
  "Sent — check your DMs.",
  "Got you. Check your inbox.",
  "On the way.",
];

function publicOrigin(): string {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (!raw) {
    throw new Error("NEXTAUTH_URL is required.");
  }

  const url = new URL(raw);
  if (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error(
      "NEXTAUTH_URL must be the public HTTPS OpenReply origin before preparing Reel 2."
    );
  }

  return url.origin;
}

async function selectInstagramAccount() {
  const requested = process.env.INSTAGRAM_ACCOUNT_ID?.trim();
  const accounts = await prisma.instagramAccount.findMany({
    orderBy: { connectedAt: "desc" },
  });

  if (accounts.length === 0) {
    throw new Error("Connect the Pour&Prompt Instagram account first.");
  }

  if (requested) {
    const selected = accounts.find(
      (account) => account.id === requested || account.instagramId === requested
    );
    if (!selected) {
      throw new Error("INSTAGRAM_ACCOUNT_ID does not match a connected account.");
    }
    return selected;
  }

  if (accounts.length > 1) {
    throw new Error(
      "Multiple Instagram accounts are connected. Set INSTAGRAM_ACCOUNT_ID to the Pour&Prompt account before retrying."
    );
  }

  return accounts[0];
}

async function main() {
  const account = await selectInstagramAccount();
  const destinationUrl = `${publicOrigin()}/daily-ops-check`;

  const existing = await prisma.automation.findMany({
    where: {
      instagramAccountId: account.id,
      OR: [{ name: campaignName }, { keywords: { has: keyword } }],
    },
    include: { trackedLinks: { orderBy: { createdAt: "asc" } } },
  });

  const exact = existing.find((campaign) => campaign.name === campaignName);
  const conflict = existing.find((campaign) => campaign.name !== campaignName);

  if (conflict) {
    throw new Error(
      `Keyword ${keyword} already belongs to another campaign (${conflict.name}). No changes were made.`
    );
  }

  if (exact) {
    console.log(
      JSON.stringify({
        status: "already_prepared",
        campaignId: exact.id,
        active: exact.isActive,
        pendingNextReel: exact.pendingNextReel,
        postId: exact.postId,
        destinationUrl: exact.trackedLinks[0]?.destinationUrl ?? null,
      })
    );
    return;
  }

  const campaign = await prisma.automation.create({
    data: {
      name: campaignName,
      goal: "Deliver the Daily Ops Check workbook from Reel 2",
      postId: null,
      postUrl: null,
      pendingNextReel: true,
      matchAnyPost: false,
      keywords: [keyword],
      matchAnyWord: false,
      dmTriggerEnabled: false,
      dmMessage,
      openingDmEnabled: false,
      linkButtonLabel: "Get Daily Ops Check",
      requireFollow: false,
      followUpEnabled: false,
      publicReplyEnabled: true,
      publicReplyMessage: publicReplies[0],
      publicReplyMessages: publicReplies,
      isActive: true,
      wholeWordMatch: true,
      workspaceId: account.workspaceId,
      instagramAccountId: account.id,
      reportShareSlug: generateReportShareSlug(),
      trackedLinks: {
        create: {
          workspaceId: account.workspaceId,
          slug: generateTrackedLinkSlug(),
          label: "Primary campaign link",
          destinationUrl,
        },
      },
    },
    include: { trackedLinks: true },
  });

  console.log(
    JSON.stringify({
      status: "prepared",
      campaignId: campaign.id,
      keyword,
      active: campaign.isActive,
      pendingNextReel: campaign.pendingNextReel,
      destinationUrl,
    })
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
