import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

import ShiftHandoffPromptCompatibilityPage from "../app/shift-handoff-prompt/page";
import { handoffPrompt, metadata } from "../app/shift-handoff/page";

describe("Shift Handoff landing routes", () => {
  it("keeps the privacy and no-invention safeguards in the canonical prompt", () => {
    expect(metadata.title).toBe("Shift Handoff Prompt | Pour&Prompt");
    expect(handoffPrompt).toContain("Do not include private guest or employee information.");
    expect(handoffPrompt).toContain("If something important is missing or unclear");
    expect(handoffPrompt).toContain("Never invent numbers");
  });

  it("safely redirects the legacy path to the canonical route", () => {
    ShiftHandoffPromptCompatibilityPage();
    expect(redirect).toHaveBeenCalledWith("/shift-handoff");
  });
});
