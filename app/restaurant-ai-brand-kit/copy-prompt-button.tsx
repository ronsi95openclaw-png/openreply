"use client";

import { useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

export default function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copyPrompt() {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = prompt;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        const copied = document.execCommand("copy");
        textarea.remove();

        if (!copied) {
          throw new Error("Copy command was rejected");
        }
      }

      setCopyState("copied");
      resetTimer.current = setTimeout(() => setCopyState("idle"), 4000);
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={copyPrompt}
        className="min-h-14 w-full border-2 border-[#11423D] bg-[#B63F30] px-5 py-3 text-base font-black uppercase tracking-[0.08em] text-[#F8F0E6] shadow-[4px_4px_0_#11423D] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none sm:text-lg"
      >
        {copyState === "copied" ? "Copied — now open ChatGPT" : "Copy the prompt"}
      </button>

      <p
        aria-live="polite"
        className="mt-3 min-h-6 text-center font-mono text-sm font-bold text-[#11423D]"
      >
        {copyState === "copied" && "Ready. Paste it into ChatGPT and fill in the brackets."}
        {copyState === "failed" && "Press and hold the prompt above, then choose Copy."}
      </p>
    </div>
  );
}
