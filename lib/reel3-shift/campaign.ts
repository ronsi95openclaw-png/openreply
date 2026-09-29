export const SHIFT_CAMPAIGN_NAME = "Pour&Prompt — Reel 3 Shift Handoff";
export const SHIFT_KEYWORD = "SHIFT";
export const SHIFT_BUTTON_LABEL = "Get Shift Handoff Prompt";
export const KNOWN_STAGED_SHIFT_CAMPAIGN_ID = "cmucup4v800006mnyn3rt5kzw";
export const KNOWN_STAGED_SHIFT_LINK_SLUG = "VwV7X0fsTg";

export type ShiftTrackedLink = {
  id: string;
  slug: string;
  destinationUrl: string;
};

export type ShiftCampaign = {
  id: string;
  instagramAccountId: string;
  name: string;
  keywords: string[];
  isActive: boolean;
  pendingNextReel: boolean;
  postId: string | null;
  postUrl: string | null;
  matchAnyPost: boolean;
  matchAnyWord: boolean;
  dmTriggerEnabled: boolean;
  publicReplyEnabled: boolean;
  wholeWordMatch: boolean;
  linkButtonLabel: string | null;
  trackedLinks: ShiftTrackedLink[];
};

export type Reel3Account = {
  id: string;
  instagramId: string;
  username: string;
  workspaceId: string;
  accessToken: string;
};

export type RecentReel = {
  id: string;
  media_product_type?: string;
  permalink?: string;
};

export function publicOrigin(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) {
    throw new Error("NEXTAUTH_URL is required.");
  }

  const url = new URL(value);
  if (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("NEXTAUTH_URL must be the public HTTPS OpenReply origin before Reel 3 can continue.");
  }

  return url.origin;
}

export function canonicalReelUrl(raw: string): string {
  const value = raw.trim();
  if (!value) {
    throw new Error("REEL3_POST_URL is required.");
  }

  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  const isInstagram = hostname === "instagram.com" || hostname === "www.instagram.com";
  if (url.protocol !== "https:" || !isInstagram || !url.pathname.startsWith("/reel/")) {
    throw new Error("REEL3_POST_URL must be the public HTTPS URL for the intended Instagram Reel.");
  }

  const slug = url.pathname.split("/").filter(Boolean)[1];
  if (!slug) {
    throw new Error("REEL3_POST_URL must include the Reel's public shortcode.");
  }

  return `https://www.instagram.com/reel/${slug}/`;
}

export function selectExactInstagramAccount<T extends Reel3Account>(
  accounts: T[],
  requested: string | undefined
): T {
  const requestedAccount = requested?.trim();
  if (!requestedAccount) {
    throw new Error("INSTAGRAM_ACCOUNT_ID is required to scope Reel 3 to @pourandprompt.");
  }

  const matches = accounts.filter(
    (account) => account.id === requestedAccount || account.instagramId === requestedAccount
  );
  if (matches.length !== 1) {
    throw new Error("INSTAGRAM_ACCOUNT_ID must match exactly one connected Instagram account.");
  }

  if (matches[0].username !== "pourandprompt") {
    throw new Error("INSTAGRAM_ACCOUNT_ID must select the connected @pourandprompt account.");
  }

  return matches[0];
}

export function requireSoleShiftCampaign(campaigns: ShiftCampaign[]): ShiftCampaign {
  if (campaigns.length !== 1) {
    throw new Error(
      `Expected exactly one ${SHIFT_KEYWORD} campaign for the selected account; found ${campaigns.length}. No changes were made.`
    );
  }

  const campaign = campaigns[0];
  if (campaign.name !== SHIFT_CAMPAIGN_NAME) {
    throw new Error(
      `Keyword ${SHIFT_KEYWORD} belongs to unexpected campaign ${campaign.name}. No changes were made.`
    );
  }

  return campaign;
}

export function assertShiftCampaignConfiguration({
  campaign,
  accountId,
  allowedDestinations,
}: {
  campaign: ShiftCampaign;
  accountId: string;
  allowedDestinations: string[];
}): ShiftTrackedLink {
  const problems: string[] = [];
  if (campaign.instagramAccountId !== accountId) problems.push("campaign belongs to another account");
  if (campaign.name !== SHIFT_CAMPAIGN_NAME) problems.push("campaign name changed");
  if (campaign.keywords.length !== 1 || campaign.keywords[0] !== SHIFT_KEYWORD) {
    problems.push("keyword is not exactly SHIFT");
  }
  if (campaign.isActive !== false) problems.push("campaign is active");
  if (campaign.pendingNextReel !== false) problems.push("campaign is waiting for the next Reel");
  if (campaign.postId !== null || campaign.postUrl !== null) problems.push("campaign is already bound to a post");
  if (campaign.matchAnyPost !== false) problems.push("matchAnyPost is enabled");
  if (campaign.matchAnyWord !== false) problems.push("matchAnyWord is enabled");
  if (campaign.wholeWordMatch !== true) problems.push("whole-word matching is disabled");
  if (campaign.publicReplyEnabled !== true) problems.push("public replies are disabled");
  if (campaign.dmTriggerEnabled !== false) problems.push("DM triggering is enabled");
  if (campaign.linkButtonLabel !== SHIFT_BUTTON_LABEL) problems.push("button label changed");
  if (campaign.trackedLinks.length !== 1) problems.push("campaign does not have exactly one tracked link");

  const link = campaign.trackedLinks[0];
  if (link && !allowedDestinations.includes(link.destinationUrl)) {
    problems.push("tracked link destination changed");
  }

  if (problems.length > 0) {
    throw new Error(`SHIFT campaign is not safely staged: ${problems.join("; ")}. No changes were made.`);
  }

  return link;
}

export function assertKnownStagedShiftLink(campaign: ShiftCampaign, link: ShiftTrackedLink): void {
  if (campaign.id !== KNOWN_STAGED_SHIFT_CAMPAIGN_ID) {
    throw new Error("SHIFT campaign ID is not the known staged Reel 3 campaign. No changes were made.");
  }
  if (link.slug !== KNOWN_STAGED_SHIFT_LINK_SLUG) {
    throw new Error("SHIFT tracked link is not the known staged Reel 3 link. No changes were made.");
  }
}

export async function repairStagedShiftLink({
  campaigns,
  accountId,
  legacyDestination,
  canonicalDestination,
  updateDestination,
}: {
  campaigns: ShiftCampaign[];
  accountId: string;
  legacyDestination: string;
  canonicalDestination: string;
  updateDestination: (campaign: ShiftCampaign, link: ShiftTrackedLink) => Promise<number>;
}): Promise<{ status: "repaired" | "already_correct"; campaignId: string; destinationUrl: string }> {
  const campaign = requireSoleShiftCampaign(campaigns);
  const link = assertShiftCampaignConfiguration({
    campaign,
    accountId,
    allowedDestinations: [legacyDestination, canonicalDestination],
  });
  assertKnownStagedShiftLink(campaign, link);

  if (link.destinationUrl === canonicalDestination) {
    return { status: "already_correct", campaignId: campaign.id, destinationUrl: canonicalDestination };
  }

  if (link.destinationUrl !== legacyDestination) {
    throw new Error("SHIFT campaign tracked link destination changed. No changes were made.");
  }

  const changed = await updateDestination(campaign, link);
  if (changed !== 1) {
    throw new Error("SHIFT campaign changed before the link repair could be applied. No changes were made.");
  }
  return { status: "repaired", campaignId: campaign.id, destinationUrl: canonicalDestination };
}

export async function bindStagedShiftCampaign({
  campaigns,
  accountId,
  canonicalDestination,
  expectedPostUrl,
  recentReels,
  activate,
}: {
  campaigns: ShiftCampaign[];
  accountId: string;
  canonicalDestination: string;
  expectedPostUrl: string;
  recentReels: () => Promise<RecentReel[]>;
  activate: (campaign: ShiftCampaign, reelId: string, reelUrl: string) => Promise<number>;
}): Promise<{ campaignId: string; postId: string; postUrl: string }> {
  const campaign = requireSoleShiftCampaign(campaigns);
  assertShiftCampaignConfiguration({ campaign, accountId, allowedDestinations: [canonicalDestination] });

  const reels = await recentReels();
  const reel = reels.find(
    (media) =>
      media.media_product_type === "REELS" &&
      media.permalink &&
      canonicalReelUrl(media.permalink) === expectedPostUrl
  );
  if (!reel) {
    throw new Error(
      "The supplied Reel URL was not found among the selected account's recent Reels. Confirm it is public and belongs to @pourandprompt."
    );
  }

  const changed = await activate(campaign, reel.id, expectedPostUrl);
  if (changed !== 1) {
    throw new Error("SHIFT campaign changed before the Reel could be bound. No changes were made.");
  }
  return { campaignId: campaign.id, postId: reel.id, postUrl: expectedPostUrl };
}
