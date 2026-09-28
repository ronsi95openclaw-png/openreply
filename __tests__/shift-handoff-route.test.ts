import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

import ShiftHandoffPromptCompatibilityPage from "../app/shift-handoff-prompt/page";
import { handoffPrompt, metadata } from "../app/shift-handoff/page";

describe("Shift Handoff landing routes", () => {
  it("keeps the privacy and no-invention safeguards in the canonical prompt", () => {
    expect(metadata.title).toBe("Shift Handoff Prompt | Pour&Prompt");
    expect(handoffPrompt).toContain("remove guest and employee names");
    expect(handoffPrompt).toContain("instead of guessing");
    expect(handoffPrompt).toContain("Do not invent sales targets");
  });

  it("safely redirects the legacy path to the canonical route", () => {
    ShiftHandoffPromptCompatibilityPage();
    expect(redirect).toHaveBeenCalledWith("/shift-handoff");
  });
});
