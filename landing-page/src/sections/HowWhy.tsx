import { useState } from "react";
import { Heading, Section } from "../ui";

const STEPS = [
  { t: "You brief the lead", h: "Tell the lead what to build.", p: "It creates a board of small tasks, each with the files it may touch, and assigns them to workers.", art: ["▦ TODO  T01 Chat route", "▦ TODO  T02 Message store", "▦ TODO  T03 Search"] },
  { t: "Workers build", h: "Every worker has its own sandbox.", p: "Each one pulls main, makes a branch, writes the code and opens a PR titled [TASK-ID] …, all inside its own Docker Sandbox.", art: ["$ git pull origin main", "$ git switch -c t01-chat-route", "$ gh pr create --title \"[T01] Chat route\""] },
  { t: "PRs get reviewed", h: "The office follows pull requests on GitHub.", p: "Review comments go back to the author. A passing PR is reported to the lead. A merged PR marks the task done.", art: ["PR #5  ◔ CodeRabbit reviewing", "PR #5  ! 2 comments → Dwight", "PR #5  ✓ passed → lead"] },
  { t: "Agents ask when stuck", h: "A question never gets lost.", p: "A decision, a blocked website or a missing key shows up in Action items and on the agent's card. You answer, they continue.", art: ["! Jim: pgvector or hosted DB?", "! Dwight: allow stripe.com?", "! Michael: need STRIPE_KEY"] },
];

export function HowItWorks() {
  const [i, setI] = useState(0);
  const s = STEPS[i]!;
  return (
    <Section id="how" alt>
      <Heading chip="The loop" title="From idea to pull request in four steps." />
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div role="tablist" className="grid gap-2">
          {STEPS.map((x, k) => (
            <button key={x.t} role="tab" aria-selected={i === k} onClick={() => setI(k)} className={`px-btn flex items-center gap-3 p-3 text-left text-lg font-bold ${i === k ? "bg-yellow" : "bg-cream"}`}>
              <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-ink text-cream">{k + 1}</span>{x.t}
            </button>
          ))}
        </div>
        <div className="px-box grid gap-5 p-6 md:grid-cols-2" aria-live="polite">
          <div>
            <h3 className="m-0 text-3xl font-bold">{s.h}</h3>
            <p className="mt-3 text-lg text-muted">{s.p}</p>
          </div>
          <div key={i} className="px-box-dark pop font-term grid content-center gap-2 p-4 text-xl !shadow-none">
            {s.art.map((l) => <div key={l} className="border-b border-white/10 pb-1">{l}</div>)}
          </div>
        </div>
      </div>
    </Section>
  );
}

const WHY = [
  ["▦", "Small tasks, one PR each", "The lead splits work into small tasks: one task, one branch, one PR. Agents message each other through the office.", "bg-blue"],
  ["⛨", "Safe by default", "Every agent works in its own Docker Sandbox, a small VM that can't touch the rest of your computer. Websites stay blocked until you allow them.", "bg-green"],
  ["☑", "You stay in charge", "Decisions, API keys and blocked sites land in Action items. The office never merges for you.", "bg-orange"],
  ["⎇", "Your GitHub workflow", "Pull requests on GitHub, reviewed by CodeRabbit, Greptile, Copilot or you.", "bg-pink"],
  ["◈", "Knows your stack", "Pick Next.js, Clerk, Stripe, Supabase and more. Agents get official agent skills and docs access.", "bg-lav"],
  ["⌂", "Runs on your machine", "No hosted service. The office, the sandboxes and your code stay on your computer.", "bg-yellow"],
] as const;

export function Why() {
  return (
    <Section id="why">
      <Heading dark chip="Why use it" title="A real team, not one chat." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {WHY.map(([ic, t, p, c]) => (
          <article key={t} className="px-box p-5 transition-transform hover:-translate-y-1 hover:rotate-[-.6deg]">
            <div className={`mb-3 grid h-12 w-12 place-items-center border-4 border-ink text-2xl ${c}`}>{ic}</div>
            <h3 className="m-0 text-xl font-bold">{t}</h3>
            <p className="mt-2 text-muted">{p}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
