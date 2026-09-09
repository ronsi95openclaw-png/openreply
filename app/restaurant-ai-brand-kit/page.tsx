import type { Metadata } from "next";
import CopyPromptButton from "./copy-prompt-button";

const starterPrompt = `You are creating Instagram content for my restaurant.

Brand context:
- We serve: [who you serve]
- Our voice is: [three words]
- Our visual style is: [colors, fonts, photo/video style]
- Always include: [signature details]
- Never use: [words, visuals, or themes to avoid]

Create three post ideas for this week. For each one, include a strong opening line, a caption in our voice, and a simple visual direction. Make it specific to our restaurant—not generic hospitality content.`;

export const metadata: Metadata = {
  title: "Restaurant AI Brand Kit | Pour&Prompt",
  description:
    "Give AI the brand context it needs to create restaurant content that sounds like you.",
  applicationName: "Pour&Prompt",
  keywords: [
    "restaurant AI brand kit",
    "restaurant marketing prompt",
    "hospitality AI",
    "Pour&Prompt",
  ],
  openGraph: {
    title: "Restaurant AI Brand Kit | Pour&Prompt",
    description:
      "A free starter prompt for restaurant content that sounds like your brand.",
    type: "website",
  },
};

const brandInputs = [
  {
    number: "01",
    title: "Who you serve",
    description:
      "Your regulars, the occasion they come for, and the neighborhood you belong to.",
  },
  {
    number: "02",
    title: "Your voice",
    description:
      "Three words that describe how you sound—warm, playful, elevated, direct, or something else.",
  },
  {
    number: "03",
    title: "Your visual rules",
    description:
      "Your colors, fonts, logo rules, and the photos or videos that feel like your place.",
  },
  {
    number: "04",
    title: "What to avoid",
    description:
      "Clichés, generic food shots, phrases, or trends that would never come from your team.",
  },
];

export default function RestaurantAiBrandKitPage() {
  return (
    <main className="min-h-screen bg-[#F8F0E6] px-4 py-8 text-[#11423D] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border-2 border-[#11423D] bg-[#fffaf2] shadow-[10px_10px_0_#B63F30]">
        <header className="border-b-2 border-dashed border-[#11423D] px-6 py-5 sm:px-10">
          <div className="flex items-center justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.18em] sm:text-sm">
            <span>Pour&amp;Prompt</span>
            <span>Brand Kit · No. 01</span>
          </div>
        </header>

        <section className="px-6 py-10 sm:px-10 sm:py-14">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#A86014]">
            Free restaurant resource
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
            Give AI your brand before you ask it for a post.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#1C3529] sm:text-xl">
            Generic prompt in, generic post out. Use this quick brand kit so
            every caption, Reel, promotion, and event post starts sounding like
            your restaurant.
          </p>
        </section>

        <section className="border-y-2 border-dashed border-[#11423D] bg-[#F8F0E6] px-6 py-8 sm:px-10">
          <h2 className="text-2xl font-black uppercase">Fill in these four things</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {brandInputs.map((item) => (
              <article
                key={item.number}
                className="border-2 border-[#11423D] bg-[#fffaf2] p-5"
              >
                <p className="font-mono text-sm font-bold text-[#A86014]">
                  {item.number}
                </p>
                <h3 className="mt-2 text-xl font-black uppercase">{item.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-[#1C3529]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-6 py-10 sm:px-10">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#A86014]">
            Copy this into ChatGPT
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase">Your starter prompt</h2>
          <pre className="mt-5 overflow-x-auto whitespace-pre-wrap border-2 border-[#11423D] bg-[#11423D] p-5 font-mono text-sm leading-relaxed text-[#F8F0E6]">
            {starterPrompt}
          </pre>
          <CopyPromptButton prompt={starterPrompt} />
          <p className="mt-2 text-base leading-relaxed text-[#1C3529]">
            Replace the brackets with your answers. Save the finished version
            as your team&apos;s starting point whenever you create content with AI.
          </p>
        </section>

        <footer className="border-t-2 border-dashed border-[#11423D] bg-[#B63F30] px-6 py-6 text-center text-[#F8F0E6] sm:px-10">
          <p className="text-xl font-black uppercase">
            Same AI. Better input. Content that sounds like you.
          </p>
          <p className="mt-2 font-mono text-sm">Pour&amp;Prompt · AI for hospitality</p>
        </footer>
      </div>
    </main>
  );
}
