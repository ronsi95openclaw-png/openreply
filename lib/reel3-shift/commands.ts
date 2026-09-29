import {
  assertShiftCampaignConfiguration,
  bindStagedShiftCampaign,
  publicOrigin,
  repairStagedShiftLink,
  requireSoleShiftCampaign,
  selectExactInstagramAccount,
  SHIFT_BUTTON_LABEL,
  SHIFT_CAMPAIGN_NAME,
  SHIFT_KEYWORD,
  KNOWN_STAGED_SHIFT_CAMPAIGN_ID,
  KNOWN_STAGED_SHIFT_LINK_SLUG,
  type RecentReel,
  type Reel3Account,
  type ShiftCampaign,
} from "@/lib/reel3-shift/campaign";

type WriteResult = { count: number };

export type Reel3Database = {
  instagramAccount: {
    findMany: (args: unknown) => Promise<Reel3Account[]>;
  };
  automation: {
    findMany: (args: unknown) => Promise<ShiftCampaign[]>;
    create: (args: unknown) => Promise<ShiftCampaign>;
    updateMany: (args: unknown) => Promise<WriteResult>;
  };
  trackedLink: {
    updateMany: (args: unknown) => Promise<WriteResult>;
  };
};

type ShiftCommandOptions = {
  database: Reel3Database;
  requestedAccount: string | undefined;
  origin: string;
};

const dmMessage =
  "Here is the Pour&Prompt Shift Handoff Prompt. Paste in your real closing notes and it will turn them into opening priorities, ownership, a team message, and missing information—without guessing. Tap below to copy it: {link}";
const publicReplies = ["Sent — check your DMs.", "Got you. Check your inbox.", "On the way."];

async function selectedAccount(database: Reel3Database, requestedAccount: string | undefined) {
  const accounts = await database.instagramAccount.findMany({
    orderBy: { connectedAt: "desc" },
  });
  return selectExactInstagramAccount(accounts, requestedAccount);
}

function shiftCandidatesWhere(accountId: string) {
  return {
    instagramAccountId: accountId,
    OR: [{ name: SHIFT_CAMPAIGN_NAME }, { keywords: { has: SHIFT_KEYWORD } }],
  };
}

async function stagedCampaign(database: Reel3Database, account: Reel3Account) {
  return database.automation.findMany({
    where: shiftCandidatesWhere(account.id),
    include: { trackedLinks: { orderBy: { createdAt: "asc" } } },
  });
}

function exactAccountWhere(account: Reel3Account) {
  return {
    id: account.id,
    instagramId: account.instagramId,
    username: "pourandprompt",
    workspaceId: account.workspaceId,
  };
}

function knownStagedCampaignWhere(account: Reel3Account) {
  return {
    id: KNOWN_STAGED_SHIFT_CAMPAIGN_ID,
    workspaceId: account.workspaceId,
    instagramAccountId: account.id,
    instagramAccount: { is: exactAccountWhere(account) },
    name: SHIFT_CAMPAIGN_NAME,
    keywords: { equals: [SHIFT_KEYWORD] },
    isActive: false,
    pendingNextReel: false,
    postId: null,
    postUrl: null,
    matchAnyPost: false,
    matchAnyWord: false,
    wholeWordMatch: true,
    publicReplyEnabled: true,
    dmTriggerEnabled: false,
    linkButtonLabel: SHIFT_BUTTON_LABEL,
  };
}

function knownTrackedLinkWhere(account: Reel3Account, destinationUrl: string) {
  return {
    slug: KNOWN_STAGED_SHIFT_LINK_SLUG,
    destinationUrl,
    workspaceId: account.workspaceId,
  };
}

function currentSafelyStagedCampaignWhere(account: Reel3Account, campaign: ShiftCampaign) {
  return {
    id: campaign.id,
    workspaceId: account.workspaceId,
    instagramAccountId: account.id,
    instagramAccount: { is: exactAccountWhere(account) },
    name: SHIFT_CAMPAIGN_NAME,
    keywords: { equals: [SHIFT_KEYWORD] },
    isActive: false,
    pendingNextReel: false,
    postId: null,
    postUrl: null,
    matchAnyPost: false,
    matchAnyWord: false,
    wholeWordMatch: true,
    publicReplyEnabled: true,
    dmTriggerEnabled: false,
    linkButtonLabel: SHIFT_BUTTON_LABEL,
  };
}

function oneCurrentCanonicalTrackedLinkWhere(
  account: Reel3Account,
  link: ShiftCampaign["trackedLinks"][number],
  destinationUrl: string
) {
  const currentLink = {
    id: link.id,
    slug: link.slug,
    workspaceId: account.workspaceId,
    destinationUrl,
  };
  return {
    some: currentLink,
    every: currentLink,
  };
}

export async function prepareReel3Shift({
  database,
  requestedAccount,
  origin,
  generateReportShareSlug,
  generateTrackedLinkSlug,
}: ShiftCommandOptions & {
  generateReportShareSlug: () => string;
  generateTrackedLinkSlug: () => string;
}): Promise<{ status: "staged" | "already_staged"; campaignId: string; destinationUrl: string }> {
  const account = await selectedAccount(database, requestedAccount);
  const destinationUrl = `${publicOrigin(origin)}/shift-handoff`;
  const candidates = await stagedCampaign(database, account);

  if (candidates.length > 0) {
    const campaign = requireSoleShiftCampaign(candidates);
    const link = assertShiftCampaignConfiguration({
      campaign,
      accountId: account.id,
      allowedDestinations: [destinationUrl],
    });
    return { status: "already_staged", campaignId: campaign.id, destinationUrl: link.destinationUrl };
  }

  const campaign = await database.automation.create({
    data: {
      name: SHIFT_CAMPAIGN_NAME,
      goal: "Deliver the Shift Handoff Prompt from Reel 3",
      postId: null,
      postUrl: null,
      pendingNextReel: false,
      matchAnyPost: false,
      keywords: [SHIFT_KEYWORD],
      matchAnyWord: false,
      dmTriggerEnabled: false,
      dmMessage,
      openingDmEnabled: false,
      linkButtonLabel: SHIFT_BUTTON_LABEL,
      requireFollow: false,
      followUpEnabled: false,
      publicReplyEnabled: true,
      publicReplyMessage: publicReplies[0],
      publicReplyMessages: publicReplies,
      isActive: false,
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

  return { status: "staged", campaignId: campaign.id, destinationUrl };
}

export async function repairReel3ShiftLink({
  database,
  requestedAccount,
  origin,
}: ShiftCommandOptions): Promise<{ status: "repaired" | "already_correct"; campaignId: string; destinationUrl: string }> {
  const account = await selectedAccount(database, requestedAccount);
  const publicUrl = publicOrigin(origin);
  const legacyDestination = `${publicUrl}/shift-handoff-prompt`;
  const canonicalDestination = `${publicUrl}/shift-handoff`;
  const campaigns = await stagedCampaign(database, account);

  return repairStagedShiftLink({
    campaigns,
    accountId: account.id,
    legacyDestination,
    canonicalDestination,
    updateDestination: async (campaign, link) => {
      const result = await database.trackedLink.updateMany({
        where: {
          id: link.id,
          ...knownTrackedLinkWhere(account, legacyDestination),
          automation: {
            is: {
              ...knownStagedCampaignWhere(account),
              trackedLinks: {
                some: { id: link.id, ...knownTrackedLinkWhere(account, legacyDestination) },
                every: { id: link.id, ...knownTrackedLinkWhere(account, legacyDestination) },
              },
            },
          },
        },
        data: { destinationUrl: canonicalDestination },
      });
      return result.count;
    },
  });
}

export async function bindReel3ShiftCampaign({
  database,
  requestedAccount,
  origin,
  expectedPostUrl,
  recentReels,
}: ShiftCommandOptions & {
  expectedPostUrl: string;
  recentReels: (account: Reel3Account) => Promise<RecentReel[]>;
}): Promise<{ campaignId: string; postId: string; postUrl: string }> {
  const account = await selectedAccount(database, requestedAccount);
  const canonicalDestination = `${publicOrigin(origin)}/shift-handoff`;
  const campaigns = await stagedCampaign(database, account);

  return bindStagedShiftCampaign({
    campaigns,
    accountId: account.id,
    canonicalDestination,
    expectedPostUrl,
    recentReels: () => recentReels(account),
    activate: async (campaign, link, reelId, reelUrl) => {
      const result = await database.automation.updateMany({
        where: {
          ...currentSafelyStagedCampaignWhere(account, campaign),
          trackedLinks: oneCurrentCanonicalTrackedLinkWhere(
            account,
            link,
            canonicalDestination
          ),
        },
        data: { postId: reelId, postUrl: reelUrl, pendingNextReel: false, isActive: true },
      });
      return result.count;
    },
  });
}
