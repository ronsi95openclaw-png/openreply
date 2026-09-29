import { afterEach, describe, expect, it, vi } from "vitest";
import { subscribeInstagramAccountToWebhooks } from "../lib/meta/client";

describe("Instagram webhook subscription", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("subscribes to button postbacks and read receipts as well as comments and messages", async () => {
    const fetch = vi.fn(async () =>
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetch);

    await expect(
      subscribeInstagramAccountToWebhooks("instagram-account", "access-token")
    ).resolves.toEqual({ success: true });

    const request = fetch.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(request.body as string)).toEqual({
      subscribed_fields: [
        "comments",
        "messages",
        "messaging_postbacks",
        "messaging_seen",
      ],
    });
  });
});
