import type { Metadata } from "next";
import Image from "next/image";
import CopyPromptButton from "../restaurant-ai-brand-kit/copy-prompt-button";

const shiftHandoffPrompt = `You are helping a restaurant manager turn anonymized shift notes into a clear handoff for the next shift.

Rules:
- Use only the facts I provide. Never invent numbers, dates, names, deadlines, owners, or priorities.
- Do not include private guest or employee information. Refer to people only by role, such as closing manager, opener, bartender, or kitchen lead.
- If something important is missing or unclear, put it under MISSING / VERIFY. Do not guess.
- Keep the language direct, practical, and easy to scan before a shift.

Return exactly these five sections:
1. SHIFT SUMMARY — up to three bullets explaining what happened.
2. FIRE FIRST — the top three priorities for the next shift, ranked by urgency.
3. OWNERS — a table with Task, Responsible Role, and Due Time. If no owner or time was provided, write UNASSIGNED or NOT PROVIDED.
4. TEAM MESSAGE — a copy-and-paste pre-shift message under 120 words.
5. MISSING / VERIFY — questions the manager must answer before assigning work.

Operation or outlet: [insert]
Next shift/date: [insert]
Anonymized closing notes: [paste notes]
Known 86'd items, maintenance issues, staffing changes, or deadlines: [insert]
Roles available next shift: [insert]`;

export const handoffPrompt = shiftHandoffPrompt;

export const metadata: Metadata = {
  title: "Shift Handoff Prompt | Pour&Prompt",
  description:
    "Turn anonymized restaurant closing notes into priorities, owners, a team message, and a clear list of what still needs verification.",
  applicationName: "Pour&Prompt",
  keywords: [
    "restaurant shift handoff",
    "restaurant manager prompt",
    "hospitality operations",
    "closing notes",
    "Pour&Prompt",
  ],
  openGraph: {
    title: "Shift Handoff Prompt | Pour&Prompt",
    description:
      "A free prompt that turns closing notes into an actionable plan for the next shift.",
    type: "website",
  },
};

const outputs = [
  ["01", "Shift summary", "What happened, without making the opener decode a wall of notes."],
  ["02", "Fire first", "The three priorities that need attention before service."],
  ["03", "Owners", "Every task paired with a role—or clearly marked unassigned."],
  ["04", "Team message", "A short pre-shift message ready to copy into your team chat."],
  ["05", "Missing / verify", "Questions that must be answered instead of guessed."],
] as const;

export default function ShiftHandoffPage() {
  return (
    <main className="min-h-screen bg-[#11423D] px-4 py-8 text-[#1F1F1F] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl overflow-hidden border-2 border-[#1C3529] bg-[#F8F0E6] shadow-[10px_10px_0_#A86014]">
        <header className="flex items-center justify-between gap-5 border-b-2 border-dashed border-[#11423D] px-6 py-5 sm:px-10">
          <Image
            src="/brand/pour-and-prompt-logo.jpeg"
            alt="Pour&Prompt"
            width={104}
            height={104}
            priority
            className="h-16 w-16 rounded-sm border border-[#11423D]/20 object-cover sm:h-20 sm:w-20"
          />
          <div className="text-right font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#11423D] sm:text-sm">
            <p>Restaurant Ops Tool</p>
            <p className="mt-1 text-[#A86014]">Shift Handoff · No. 03</p>
          </div>
        </header>

        <section className="px-6 py-10 sm:px-10 sm:py-14">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#B63F30]">
            Free ChatGPT prompt
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-[0.94] tracking-tight text-[#11423D] sm:text-6xl">
            Stop making your opener play detective.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#1C3529] sm:text-xl">
            Closing notes explain what happened. This prompt turns anonymized
            notes into priorities, owners, a team message, and a list of what
            still needs verification.
          </p>
        </section>

        <section className="border-y-2 border-dashed border-[#11423D] bg-[#fffaf2] px-6 py-9 sm:px-10">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#A86014]">
            One message. One shift plan.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {outputs.map(([number, title, description]) => (
              <article key={number} className="border-2 border-[#11423D] bg-[#F8F0E6] p-5">
                <p className="font-mono text-xs font-bold text-[#A86014]">{number}</p>
                <h2 className="mt-2 text-xl font-black uppercase text-[#11423D]">{title}</h2>
                <p className="mt-2 leading-relaxed text-[#1C3529]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-6 py-10 sm:px-10">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#A86014]">
            Copy this into ChatGPT
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase text-[#11423D]">
            Shift Handoff Prompt
          </h2>
          <pre className="mt-5 max-h-[34rem] overflow-auto whitespace-pre-wrap border-2 border-[#11423D] bg-[#11423D] p-5 font-mono text-sm leading-relaxed text-[#F8F0E6]">
            {shiftHandoffPrompt}
          </pre>
          <CopyPromptButton prompt={shiftHandoffPrompt} />
          <p className="mt-3 text-base leading-relaxed text-[#1C3529]">
            Replace the brackets and paste only anonymized operational notes.
            Leave out guest names, employee names, phone numbers, and private details.
          </p>
        </section>

        <section className="border-t-2 border-dashed border-[#11423D] bg-[#fffaf2] px-6 py-8 sm:px-10">
          <div className="border-2 border-[#C83221] bg-[#F8F0E6] p-5 shadow-[5px_5px_0_#C83221]">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#C83221]">
              Guardrails built in
            </p>
            <p className="mt-3 text-2xl font-black uppercase text-[#11423D]">
              No made-up numbers. No private details.
            </p>
            <p className="mt-3 leading-relaxed text-[#1C3529]">
              Missing information gets flagged for verification instead of being invented.
            </p>
          </div>
        </section>

        <footer className="border-t-2 border-dashed border-[#11423D] bg-[#B63F30] px-6 py-6 text-center text-[#F8F0E6] sm:px-10">
          <p className="text-xl font-black uppercase">Notes become action.</p>
          <p className="mt-2 font-mono text-sm">
            Pour&amp;Prompt · Practical AI for hospitality
          </p>
        </footer>
      </div>
    </main>
  );
}
