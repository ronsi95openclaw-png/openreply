import { describe, expect, it, vi } from "vitest";
import {
  assertShiftCampaignConfiguration,
  bindStagedShiftCampaign,
  repairStagedShiftLink,
  selectExactInstagramAccount,
  type ShiftCampaign,
} from "../lib/reel3-shift/campaign";

const origin = "https://pourandprompt.example";
const canonicalDestination = `${origin}/shift-handoff`;
const legacyDestination = `${origin}/shift-handoff-prompt`;

function stagedCampaign(overrides: Partial<ShiftCampaign> = {}): ShiftCampaign {
  return {
    id: "shift-campaign",
    instagramAccountId: "pour-and-prompt",
    name: "Pour&Prompt — Reel 3 Shift Handoff",
    keywords: ["SHIFT"],
    isActive: false,
    pendingNextReel: false,
    postId: null,
    postUrl: null,
    matchAnyPost: false,
    matchAnyWord: false,
    dmTriggerEnabled: false,
    publicReplyEnabled: true,
    wholeWordMatch: true,
    linkButtonLabel: "Get Shift Handoff Prompt",
    trackedLinks: [{ id: "tracked-link", slug: "VwV7X0fsTg", destinationUrl: canonicalDestination }],
    ...overrides,
  };
}

describe("Reel 3 SHIFT campaign guards", () => {
  it("accepts only the fully staged canonical configuration", () => {
    expect(() =>
      assertShiftCampaignConfiguration({
        campaign: stagedCampaign(),
        accountId: "pour-and-prompt",
        allowedDestinations: [canonicalDestination],
      })
    ).not.toThrow();
  });

  it("rejects a changed flag, keyword, account, or ambiguous tracked links before writing", () => {
    const unsafeCampaigns = [
      stagedCampaign({ matchAnyPost: true }),
      stagedCampaign({ keywords: ["SHIFT", "EXTRA"] }),
      stagedCampaign({ instagramAccountId: "another-account" }),
      stagedCampaign({ trackedLinks: [] }),
      stagedCampaign({ trackedLinks: [{ id: "one", slug: "VwV7X0fsTg", destinationUrl: canonicalDestination }, { id: "two", slug: "VwV7X0fsTg", destinationUrl: canonicalDestination }] }),
    ];

    for (const campaign of unsafeCampaigns) {
      expect(() =>
        assertShiftCampaignConfiguration({
          campaign,
          accountId: "pour-and-prompt",
          allowedDestinations: [canonicalDestination],
        })
      ).toThrow("not safely staged");
    }
  });

  it("requires an explicit account selector that resolves exactly once", () => {
    const accounts = [
      { id: "pour-and-prompt", instagramId: "1784" },
      { id: "other", instagramId: "1785" },
    ];
    expect(selectExactInstagramAccount(accounts, "1784").id).toBe("pour-and-prompt");
    expect(() => selectExactInstagramAccount(accounts, undefined)).toThrow("INSTAGRAM_ACCOUNT_ID is required");
    expect(() => selectExactInstagramAccount(accounts, "missing")).toThrow("exactly one");
  });
});

describe("Reel 3 staged-link repair", () => {
  it("repairs only the known legacy destination and is idempotent after repair", async () => {
    const write = vi.fn(async () => undefined);
    const legacyCampaign = stagedCampaign({
      id: "cmucup4v800006mnyn3rt5kzw",
      trackedLinks: [{ id: "tracked-link", slug: "VwV7X0fsTg", destinationUrl: legacyDestination }],
    });

    await expect(
      repairStagedShiftLink({
        campaigns: [legacyCampaign],
        accountId: "pour-and-prompt",
        legacyDestination,
        canonicalDestination,
        updateDestination: write,
      })
    ).resolves.toEqual({ status: "repaired", campaignId: "cmucup4v800006mnyn3rt5kzw", destinationUrl: canonicalDestination });
    expect(write).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledWith("tracked-link", canonicalDestination);

    await expect(
      repairStagedShiftLink({
        campaigns: [stagedCampaign({ id: "cmucup4v800006mnyn3rt5kzw" })],
        accountId: "pour-and-prompt",
        legacyDestination,
        canonicalDestination,
        updateDestination: write,
      })
    ).resolves.toEqual({ status: "already_correct", campaignId: "cmucup4v800006mnyn3rt5kzw", destinationUrl: canonicalDestination });
    expect(write).toHaveBeenCalledOnce();
  });

  it("refuses changed destinations, unsafe state, and more than one SHIFT candidate without writing", async () => {
    const write = vi.fn(async () => undefined);
    await expect(
      repairStagedShiftLink({
        campaigns: [stagedCampaign({ id: "cmucup4v800006mnyn3rt5kzw", trackedLinks: [{ id: "tracked-link", slug: "VwV7X0fsTg", destinationUrl: `${origin}/other` }] })],
        accountId: "pour-and-prompt",
        legacyDestination,
        canonicalDestination,
        updateDestination: write,
      })
    ).rejects.toThrow("not safely staged");
    await expect(
      repairStagedShiftLink({
        campaigns: [stagedCampaign(), stagedCampaign({ id: "duplicate" })],
        accountId: "pour-and-prompt",
        legacyDestination,
        canonicalDestination,
        updateDestination: write,
      })
    ).rejects.toThrow("exactly one");
    await expect(
      repairStagedShiftLink({
        campaigns: [stagedCampaign({ id: "unexpected-campaign" })],
        accountId: "pour-and-prompt",
        legacyDestination,
        canonicalDestination,
        updateDestination: write,
      })
    ).rejects.toThrow("known staged Reel 3 campaign");
    await expect(
      repairStagedShiftLink({
        campaigns: [
          stagedCampaign({
            id: "cmucup4v800006mnyn3rt5kzw",
            trackedLinks: [{ id: "tracked-link", slug: "unexpected-link", destinationUrl: canonicalDestination }],
          }),
        ],
        accountId: "pour-and-prompt",
        legacyDestination,
        canonicalDestination,
        updateDestination: write,
      })
    ).rejects.toThrow("known staged Reel 3 link");
    expect(write).not.toHaveBeenCalled();
  });
});

describe("Reel 3 exact binding", () => {
  it("refuses unsafe SHIFT state before looking up Instagram media or activating the campaign", async () => {
    const recentReels = vi.fn(async () => []);
    const activate = vi.fn(async () => undefined);

    await expect(
      bindStagedShiftCampaign({
        campaigns: [stagedCampaign({ isActive: true })],
        accountId: "pour-and-prompt",
        canonicalDestination,
        expectedPostUrl: "https://www.instagram.com/reel/reel-three/",
        recentReels,
        activate,
      })
    ).rejects.toThrow("not safely staged");
    expect(recentReels).not.toHaveBeenCalled();
    expect(activate).not.toHaveBeenCalled();
  });

  it("activates only after the exact public permalink is found", async () => {
    const activate = vi.fn(async () => undefined);
    await expect(
      bindStagedShiftCampaign({
        campaigns: [stagedCampaign()],
        accountId: "pour-and-prompt",
        canonicalDestination,
        expectedPostUrl: "https://www.instagram.com/reel/reel-three/",
        recentReels: async () => [
          { id: "wrong-type", media_product_type: "IMAGE", permalink: "https://www.instagram.com/reel/reel-three/" },
          { id: "reel-three-id", media_product_type: "REELS", permalink: "https://www.instagram.com/reel/reel-three/?utm_source=share" },
        ],
        activate,
      })
    ).resolves.toEqual({ campaignId: "shift-campaign", postId: "reel-three-id", postUrl: "https://www.instagram.com/reel/reel-three/" });
    expect(activate).toHaveBeenCalledWith("shift-campaign", "reel-three-id", "https://www.instagram.com/reel/reel-three/");
  });
});
