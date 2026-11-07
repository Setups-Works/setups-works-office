import { useLayoutEffect, useRef, useState } from "react";
import { Heading, Section } from "../ui";
import { ScrollTrigger, gsap, reduced, spotlight, useReveal } from "../fx";

const STEPS = [
  { t: "You brief the lead", h: "Tell the lead what to build.", p: "It creates a board of small tasks, each with the files it may touch, and assigns them to workers.", art: ["▦ TODO  T01 Chat route", "▦ TODO  T02 Message store", "▦ TODO  T03 Search"], c: "#29adff" },
  { t: "Workers build", h: "Every worker has its own sandbox.", p: "Each one pulls main, makes a branch, writes the code and opens a PR titled [TASK-ID] …, all inside its own Docker Sandbox.", art: ["$ git pull origin main", "$ git switch -c t01-chat-route", "$ gh pr create --title \"[T01] Chat route\""], c: "#00e436" },
  { t: "PRs get reviewed", h: "The office follows pull requests on GitHub.", p: "Review comments go back to the author. A passing PR is reported to the lead. A merged PR marks the task done.", art: ["PR #5  ◔ CodeRabbit reviewing", "PR #5  ! 2 comments → Dwight", "PR #5  ✓ passed → lead"], c: "#ffa300" },
  { t: "Agents ask when stuck", h: "A question never gets lost.", p: "A decision, a blocked website or a missing key shows up in Action items and on the agent's card. You answer, they continue.", art: ["! Jim: pgvector or hosted DB?", "! Dwight: allow stripe.com?", "! Michael: need STRIPE_KEY"], c: "#ff77a8" },
];

export function HowItWorks() {
  const root = useReveal<HTMLDivElement>();
  const [i, setI] = useState(0);
  const art = useRef<HTMLDivElement>(null);
  const prog = useRef<HTMLDivElement>(null);

  // Scroll-linked: each step block activates the matching terminal; the rail fills as you scroll.
  useLayoutEffect(() => {
    if (reduced() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".step-block").forEach((el, k) => {
        ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 55%", onToggle: (st) => st.isActive && setI(k) });
      });
      gsap.fromTo(prog.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".steps-col", start: "top 60%", end: "bottom 60%", scrub: true } });
    }, root);
    return () => ctx.revert();
  }, [root]);

  useLayoutEffect(() => {
    if (reduced() || !art.current) return;
    gsap.fromTo(art.current.children, { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.45, ease: "power3.out" });
  }, [i]);

  const s = STEPS[i]!;
  return (
    <Section id="how" alt>
      <div ref={root}>
        <Heading chip="The loop" title="From idea to pull request in four steps." sub="Scroll through, or click a step." />
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="steps-col relative pl-10">
            <div className="absolute bottom-0 left-3 top-0 w-1 bg-white/10"><div ref={prog} className="h-full origin-top bg-gradient-to-b from-yellow to-pink" /></div>
            {STEPS.map((x, k) => (
              <button key={x.t} onClick={() => { setI(k); document.querySelectorAll(".step-block")[k]?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                className={`step-block reveal glass mb-6 block w-full p-5 text-left transition-all ${i === k ? "!border-yellow" : "opacity-60"}`} onMouseMove={spotlight}>
                <span className="absolute -left-[34px] top-5 grid h-7 w-7 place-items-center border-[3px] border-ink text-sm font-bold text-ink" style={{ background: i >= k ? x.c : "#83769c" }}>{k + 1}</span>
                <h3 className="m-0 text-2xl font-bold">{x.t}</h3>
                <p className="mb-0 mt-2 text-cream/75">{x.p}</p>
              </button>
            ))}
          </div>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="px-box-dark p-5">
              <div className="mb-3 flex items-center gap-2"><span className="h-3 w-3 bg-red" /><span className="h-3 w-3 bg-yellow" /><span className="h-3 w-3 bg-green" /><b className="ml-2 text-sm text-cream/70">step {i + 1} / 4</b></div>
              <h3 className="m-0 mb-4 text-2xl font-bold" style={{ color: s.c }}>{s.h}</h3>
              <div ref={art} className="font-term grid gap-2 text-xl">
                {s.art.map((l) => <div key={l} className="border-b border-white/10 pb-1">{l}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

const WHY = [
  ["▦", "Small tasks, one PR each", "The lead splits work into small tasks: one task, one branch, one PR. Agents message each other through the office.", "#29adff"],
  ["⛨", "Safe by default", "Every agent works in its own Docker Sandbox, a small VM that can't touch the rest of your computer. Websites stay blocked until you allow them.", "#00e436"],
  ["☑", "You stay in charge", "Decisions, API keys and blocked sites land in Action items. The office never merges for you.", "#ffa300"],
  ["⎇", "Your GitHub workflow", "Pull requests on GitHub, reviewed by CodeRabbit, Greptile, Copilot or you.", "#ff77a8"],
  ["◈", "Knows your stack", "Pick Next.js, Clerk, Stripe, Supabase and more. Agents get official agent skills and docs access.", "#83769c"],
  ["⌂", "Runs on your machine", "No hosted service. The office, the sandboxes and your code stay on your computer.", "#ffec27"],
] as const;

export function Why() {
  const root = useReveal<HTMLDivElement>();
  const tilt = (e: React.MouseEvent<HTMLElement>) => {
    spotlight(e);
    if (reduced()) return;
    const r = e.currentTarget.getBoundingClientRect();
    gsap.to(e.currentTarget, { rotationY: ((e.clientX - r.left) / r.width - 0.5) * 12, rotationX: -((e.clientY - r.top) / r.height - 0.5) * 12, transformPerspective: 700, duration: 0.3 });
  };
  const flat = (e: React.MouseEvent<HTMLElement>) => { gsap.to(e.currentTarget, { rotationX: 0, rotationY: 0, duration: 0.5, ease: "power3.out" }); };
  return (
    <Section id="why">
      <div ref={root}>
        <Heading chip="Why use it" title="A real team, not one chat." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map(([ic, t, p, c]) => (
            <article key={t} className="reveal glass p-6" onMouseMove={tilt} onMouseLeave={flat}>
              <div className="mb-4 grid h-12 w-12 place-items-center border-4 border-ink text-2xl text-ink" style={{ background: c }}>{ic}</div>
              <h3 className="m-0 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-cream/70">{p}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
