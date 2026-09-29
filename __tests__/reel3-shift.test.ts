import { describe, expect, it, vi } from "vitest";
import {
  assertShiftCampaignConfiguration,
  bindStagedShiftCampaign,
  KNOWN_STAGED_SHIFT_CAMPAIGN_ID,
  repairStagedShiftLink,
  selectExactInstagramAccount,
  type ShiftCampaign,
} from "../lib/reel3-shift/campaign";
import {
  bindReel3ShiftCampaign,
  prepareReel3Shift,
  repairReel3ShiftLink,
  type Reel3Database,
} from "../lib/reel3-shift/commands";

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

const selectedAccount = {
  id: "pour-and-prompt",
  instagramId: "1784",
  username: "pourandprompt",
  workspaceId: "workspace-1",
  accessToken: "encrypted-token",
};

function mockedDatabase(overrides: Partial<Record<"accounts" | "campaigns" | "create" | "repair" | "bind", unknown>> = {}) {
  return {
    instagramAccount: {
      findMany: vi.fn().mockResolvedValue(overrides.accounts ?? [selectedAccount]),
    },
    automation: {
      findMany: vi.fn().mockResolvedValue(overrides.campaigns ?? []),
      create: vi.fn().mockResolvedValue(overrides.create ?? stagedCampaign({ id: KNOWN_STAGED_SHIFT_CAMPAIGN_ID })),
      updateMany: vi.fn().mockResolvedValue(overrides.bind ?? { count: 1 }),
    },
    trackedLink: {
      updateMany: vi.fn().mockResolvedValue(overrides.repair ?? { count: 1 }),
    },
  } as unknown as Reel3Database;
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
      selectedAccount,
      { id: "other", instagramId: "1785", username: "other", workspaceId: "workspace-2", accessToken: "encrypted-token" },
    ];
    expect(selectExactInstagramAccount(accounts, "1784").id).toBe("pour-and-prompt");
    expect(() => selectExactInstagramAccount(accounts, undefined)).toThrow("INSTAGRAM_ACCOUNT_ID is required");
    expect(() => selectExactInstagramAccount(accounts, "missing")).toThrow("exactly one");
    expect(() => selectExactInstagramAccount([{ ...selectedAccount, username: "not-pourandprompt" }], "1784")).toThrow("@pourandprompt");
  });
});

describe("Reel 3 staged-link repair", () => {
  it("repairs only the known legacy destination and is idempotent after repair", async () => {
    const write = vi.fn(async () => 1);
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
    expect(write).toHaveBeenCalledWith(legacyCampaign, legacyCampaign.trackedLinks[0]);

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
    const write = vi.fn(async () => 1);
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
    const activate = vi.fn(async () => 1);

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
    const activate = vi.fn(async () => 1);
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
    expect(activate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "shift-campaign" }),
      expect.objectContaining({ id: "tracked-link", destinationUrl: canonicalDestination }),
      "reel-three-id",
      "https://www.instagram.com/reel/reel-three/"
    );
  });
});

describe("Reel 3 command database guards", () => {
  it("prepares once, then makes no second database write", async () => {
    const database = mockedDatabase();
    await expect(
      prepareReel3Shift({
        database,
        requestedAccount: "1784",
        origin,
        generateReportShareSlug: () => "report-share",
        generateTrackedLinkSlug: () => "link-share",
      })
    ).resolves.toMatchObject({ status: "staged" });

    (database.automation.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      stagedCampaign({ id: KNOWN_STAGED_SHIFT_CAMPAIGN_ID }),
    ]);
    await expect(
      prepareReel3Shift({
        database,
        requestedAccount: "1784",
        origin,
        generateReportShareSlug: () => "another-report-share",
        generateTrackedLinkSlug: () => "another-link-share",
      })
    ).resolves.toMatchObject({ status: "already_staged" });
    expect(database.automation.create).toHaveBeenCalledOnce();
  });

  it("does not write when the requested account is not @pourandprompt or candidates are duplicated", async () => {
    const wrongAccount = mockedDatabase({
      accounts: [{ ...selectedAccount, username: "another-account" }],
    });
    await expect(
      prepareReel3Shift({
        database: wrongAccount,
        requestedAccount: "1784",
        origin,
        generateReportShareSlug: () => "report-share",
        generateTrackedLinkSlug: () => "link-share",
      })
    ).rejects.toThrow("@pourandprompt");
    expect(wrongAccount.automation.create).not.toHaveBeenCalled();

    const duplicates = mockedDatabase({
      campaigns: [stagedCampaign(), stagedCampaign({ id: "duplicate" })],
    });
    await expect(
      prepareReel3Shift({
        database: duplicates,
        requestedAccount: "1784",
        origin,
        generateReportShareSlug: () => "report-share",
        generateTrackedLinkSlug: () => "link-share",
      })
    ).rejects.toThrow("exactly one");
    expect(duplicates.automation.create).not.toHaveBeenCalled();
  });

  it("refuses a stale conditional repair write", async () => {
    const database = mockedDatabase({
      campaigns: [
        stagedCampaign({
          id: KNOWN_STAGED_SHIFT_CAMPAIGN_ID,
          trackedLinks: [{ id: "tracked-link", slug: "VwV7X0fsTg", destinationUrl: legacyDestination }],
        }),
      ],
      repair: { count: 0 },
    });
    await expect(
      repairReel3ShiftLink({ database, requestedAccount: "1784", origin })
    ).rejects.toThrow("changed before the link repair");
    expect(database.trackedLink.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "VwV7X0fsTg",
          destinationUrl: legacyDestination,
          automation: expect.any(Object),
        }),
      })
    );
  });

  it("binds a valid replacement campaign created by preparation", async () => {
    const replacement = stagedCampaign({
      id: "recreated-shift-campaign",
      trackedLinks: [
        { id: "recreated-tracked-link", slug: "recreated-link", destinationUrl: canonicalDestination },
      ],
    });
    const database = mockedDatabase();
    let persistedCampaigns: ShiftCampaign[] = [];
    const findMany = database.automation.findMany as unknown as ReturnType<typeof vi.fn>;
    const create = database.automation.create as unknown as ReturnType<typeof vi.fn>;
    findMany.mockImplementation(async () => persistedCampaigns);
    create.mockImplementation(async () => {
      persistedCampaigns = [replacement];
      return replacement;
    });

    await expect(
      prepareReel3Shift({
        database,
        requestedAccount: "1784",
        origin,
        generateReportShareSlug: () => "replacement-report-share",
        generateTrackedLinkSlug: () => "recreated-link",
      })
    ).resolves.toMatchObject({ status: "staged", campaignId: "recreated-shift-campaign" });

    await expect(
      bindReel3ShiftCampaign({
        database,
        requestedAccount: "1784",
        origin,
        expectedPostUrl: "https://www.instagram.com/reel/reel-three/",
        recentReels: async () => [
          { id: "reel-three-id", media_product_type: "REELS", permalink: "https://www.instagram.com/reel/reel-three/" },
        ],
      })
    ).resolves.toEqual({
      campaignId: "recreated-shift-campaign",
      postId: "reel-three-id",
      postUrl: "https://www.instagram.com/reel/reel-three/",
    });
    expect(database.automation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "recreated-shift-campaign",
          trackedLinks: expect.objectContaining({
            some: expect.objectContaining({ id: "recreated-tracked-link", slug: "recreated-link" }),
            every: expect.objectContaining({ id: "recreated-tracked-link", slug: "recreated-link" }),
          }),
        }),
      })
    );
  });

  it("refuses a changed replacement configuration during the conditional bind write", async () => {
    const database = mockedDatabase({
      campaigns: [
        stagedCampaign({
          id: "recreated-shift-campaign",
          trackedLinks: [
            { id: "recreated-tracked-link", slug: "recreated-link", destinationUrl: canonicalDestination },
          ],
        }),
      ],
      bind: { count: 0 },
    });
    const recentReels = vi.fn(async () => [
      { id: "reel-three-id", media_product_type: "REELS", permalink: "https://www.instagram.com/reel/reel-three/" },
    ]);
    await expect(
      bindReel3ShiftCampaign({
        database,
        requestedAccount: "1784",
        origin,
        expectedPostUrl: "https://www.instagram.com/reel/reel-three/",
        recentReels,
      })
    ).rejects.toThrow("changed before the Reel could be bound");
    expect(recentReels).toHaveBeenCalledOnce();
    expect(database.automation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "recreated-shift-campaign",
          instagramAccount: expect.any(Object),
          trackedLinks: expect.objectContaining({
            some: expect.objectContaining({ id: "recreated-tracked-link", slug: "recreated-link" }),
            every: expect.objectContaining({ id: "recreated-tracked-link", slug: "recreated-link" }),
          }),
        }),
      })
    );
  });
});
