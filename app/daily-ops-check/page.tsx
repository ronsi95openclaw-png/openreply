import type { Metadata } from "next";
import Image from "next/image";

const downloadPath =
  "/downloads/Pour_and_Prompt_Daily_Ops_Check.xlsx";

export const metadata: Metadata = {
  title: "Daily Ops Check | Pour&Prompt",
  description:
    "Turn yesterday's restaurant numbers into today's manager action list with the free Pour&Prompt Daily Ops Check workbook.",
  applicationName: "Pour&Prompt",
  keywords: [
    "restaurant daily ops check",
    "restaurant manager workbook",
    "restaurant labor review",
    "hospitality operations",
    "Pour&Prompt",
  ],
  openGraph: {
    title: "Daily Ops Check | Pour&Prompt",
    description:
      "Enter yesterday's numbers, review what needs attention, and copy a prepared manager prompt into ChatGPT.",
    type: "website",
  },
};

const workbookSteps = [
  {
    number: "01",
    label: "Enter",
    title: "Add yesterday's numbers",
    description:
      "Sales, labor, overtime, comps, voids, discounts, call-outs, 86'd items, and shift notes.",
  },
  {
    number: "02",
    label: "Review",
    title: "See what needs attention",
    description:
      "The workbook calculates the useful ratios and compares them only with targets you provide.",
  },
  {
    number: "03",
    label: "Act",
    title: "Copy the prepared prompt",
    description:
      "Paste the daily summary into ChatGPT for a short manager-level action list in plain restaurant language.",
  },
];

export default function DailyOpsCheckPage() {
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
            <p className="mt-1 text-[#A86014]">Daily Check · No. 02</p>
          </div>
        </header>

        <section className="px-6 py-10 sm:px-10 sm:py-14">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#B63F30]">
            Free Excel workbook
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-[0.94] tracking-tight text-[#11423D] sm:text-6xl">
            Yesterday&apos;s numbers. Today&apos;s action list.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#1C3529] sm:text-xl">
            Your closing report tells you what happened. This workbook helps
            you decide what to check before today&apos;s shift.
          </p>

          <a
            href={downloadPath}
            download
            className="mt-8 inline-flex min-h-12 items-center justify-center border-2 border-[#11423D] bg-[#B63F30] px-6 py-3 text-base font-black uppercase tracking-wide text-[#F8F0E6] shadow-[5px_5px_0_#11423D] transition-transform hover:-translate-y-0.5 focus-visible:outline-[#F8F0E6]"
          >
            Download Daily Ops Check
          </a>
          <p className="mt-3 font-mono text-xs uppercase tracking-wide text-[#1C3529]">
            Excel workbook · 4 tabs · no new software required
          </p>
        </section>

        <section className="border-y-2 border-dashed border-[#11423D] bg-[#fffaf2] px-6 py-9 sm:px-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {workbookSteps.map((step) => (
              <article
                key={step.number}
                className="border-2 border-[#11423D] bg-[#F8F0E6] p-5"
              >
                <div className="flex items-center justify-between gap-3 font-mono text-xs font-bold uppercase tracking-[0.12em]">
                  <span className="text-[#A86014]">{step.number}</span>
                  <span className="text-[#B63F30]">{step.label}</span>
                </div>
                <h2 className="mt-4 text-xl font-black uppercase leading-tight text-[#11423D]">
                  {step.title}
                </h2>
                <p className="mt-3 leading-relaxed text-[#1C3529]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 px-6 py-10 sm:px-10 md:grid-cols-[1.25fr_0.75fr] md:items-center">
          <div>
            <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#A86014]">
              Guardrail built in
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-[#11423D]">
              No target? It does not guess.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#1C3529]">
              If your operation has not entered a target, the workbook flags
              the missing benchmark instead of letting AI invent one.
            </p>
          </div>
          <div className="border-2 border-[#11423D] bg-white p-5 text-center shadow-[5px_5px_0_#A86014]">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#B63F30]">
              Status
            </p>
            <p className="mt-3 text-3xl font-black uppercase text-[#B63F30]">
              Set Target
            </p>
            <p className="mt-2 font-bold text-[#11423D]">
              AI doesn&apos;t get to guess.
            </p>
          </div>
        </section>

        <footer className="border-t-2 border-dashed border-[#11423D] bg-[#B63F30] px-6 py-6 text-center text-[#F8F0E6] sm:px-10">
          <p className="text-xl font-black uppercase">
            Manual first. Automate later.
          </p>
          <p className="mt-2 font-mono text-sm">
            Pour&amp;Prompt · Practical AI for hospitality
          </p>
        </footer>
      </div>
    </main>
  );
}
