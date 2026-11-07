import { useReveal } from "../fx";

const WHY = [
  ["Small tasks, one PR each", "The lead splits work into small tasks: one task, one branch, one PR. Agents message each other through the office.", "#29adff"],
  ["Safe by default", "Every agent works in its own Docker Sandbox, a small VM that can't touch the rest of your computer. Websites stay blocked until you allow them.", "#00e436"],
  ["You stay in charge", "Decisions, API keys and blocked sites land in Action items. The office never merges for you.", "#ffa300"],
  ["Your GitHub workflow", "Pull requests on GitHub, reviewed by CodeRabbit, Greptile, Copilot or you.", "#ff77a8"],
  ["Knows your stack", "Pick Next.js, Clerk, Stripe, Supabase and more. Agents get official agent skills and docs access.", "#83769c"],
  ["Runs on your machine", "No hosted service. The office, the sandboxes and your code stay on your computer.", "#ffec27"],
] as const;

export function Why() {
  const root = useReveal<HTMLDivElement>();
  return (
    <section id="why" className="scroll-mt-14 border-y-4 border-ink bg-cream py-16 sm:py-24">
      <div ref={root} className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="reveal px-btn inline-block bg-yellow px-2.5 py-0.5 text-sm font-bold uppercase tracking-widest">Why use it</span>
          <h2 className="reveal mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl">A real team, not one chat.</h2>
          <p className="reveal mt-4 max-w-sm text-lg text-muted">Most AI tools give you a single assistant. This gives you a lead, workers, reviews and an inbox for the things only you can decide.</p>
        </div>
        <ol className="m-0 list-none p-0">
          {WHY.map(([t, p, c], i) => (
            <li key={t} className="reveal flex gap-4 border-t-4 border-ink py-5 first:border-t-0 first:pt-0">
              <span className="grid h-11 w-11 shrink-0 place-items-center border-4 border-ink text-xl font-bold" style={{ background: c }}>{i + 1}</span>
              <div><h3 className="m-0 text-2xl font-bold">{t}</h3><p className="mb-0 mt-1 text-lg text-muted">{p}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
