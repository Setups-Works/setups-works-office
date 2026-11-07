import { useRef } from "react";
import { CopyCommand, Heading, Section } from "../ui";
import { Counter, Magnetic, gsap, reduced, spotlight, useReveal } from "../fx";

const STATS: [number, string, string, string][] = [
  [2, "", "agent types", "Claude Code & Codex"],
  [100, "%", "local", "runs on your machine"],
  [1, "", "VM per agent", "Docker Sandboxes"],
  [0, "", "auto-merges", "you press merge"],
];
const TAGS = ["Claude Code", "Codex", "Docker Sandboxes", "GitHub", "CodeRabbit", "Greptile", "Copilot", "Next.js", "Clerk", "Stripe", "Supabase", "tmux"];

export function Stats() {
  const root = useReveal<HTMLDivElement>();
  return (
    <section className="dark-sec border-y-4 border-ink py-14">
      <div ref={root} className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map(([n, suf, l, d]) => (
            <div key={l} className="reveal glass p-4 text-center" onMouseMove={spotlight}>
              <div className="text-5xl font-bold text-yellow"><Counter to={n} suffix={suf} /></div>
              <div className="font-bold">{l}</div>
              <div className="text-sm text-cream/60">{d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 overflow-hidden" aria-hidden="true">
        <div className="marquee gap-0">
          {[...TAGS, ...TAGS].map((t, i) => (
            <span key={i} className="mx-2 whitespace-nowrap border-2 border-white/20 bg-white/5 px-4 py-1 text-lg font-bold text-cream/80">◆ {t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Does it merge code for me?", "No. The office follows pull requests on GitHub and reports their status, but merging is always yours."],
  ["Where does the code run?", "Everything runs on your machine. Each agent gets its own Docker Sandbox (a small VM). Where sandboxes aren't supported, set agents to Local in Settings → Team and they run directly, with permission prompts on."],
  ["Which platforms are supported?", "Sandboxes need macOS 14+ on Apple silicon, Windows 11, or Ubuntu 24.04+. Local mode works elsewhere."],
  ["Which agents can I use?", "Claude Code or Codex, chosen per agent for the lead and each worker."],
  ["Can I try it without risk?", "Yes. Use a throwaway repo: git init -b main, add a README, commit, then run the command above."],
];

function Item({ q, a, open }: { q: string; a: string; open?: boolean }) {
  const body = useRef<HTMLDivElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const state = useRef(!!open);
  const toggle = () => {
    state.current = !state.current;
    const on = state.current;
    if (reduced()) { if (body.current) body.current.style.height = on ? "auto" : "0"; return; }
    gsap.to(body.current, { height: on ? "auto" : 0, duration: 0.35, ease: "power2.inOut" });
    gsap.to(arrow.current, { rotate: on ? 90 : 0, duration: 0.25 });
  };
  return (
    <div className="reveal glass" onMouseMove={spotlight}>
      <button onClick={toggle} aria-expanded={state.current} className="flex w-full items-center gap-3 p-4 text-left text-lg font-bold">
        <span ref={arrow} className="inline-block" style={{ transform: open ? "rotate(90deg)" : undefined }}>▶</span>{q}
      </button>
      <div ref={body} className="overflow-hidden" style={{ height: open ? "auto" : 0 }}><p className="m-0 px-4 pb-4 text-cream/70">{a}</p></div>
    </div>
  );
}

export function Faq() {
  const root = useReveal<HTMLDivElement>();
  return (
    <Section id="faq">
      <div ref={root}>
        <Heading chip="FAQ" title="Good questions." />
        <div className="mx-auto grid max-w-3xl gap-3">{FAQ.map(([q, a], i) => <Item key={q} q={q} a={a} open={i === 0} />)}</div>
      </div>
    </Section>
  );
}

export function FinalCta({ onCopied }: { onCopied: () => void }) {
  const root = useReveal<HTMLDivElement>();
  return (
    <section className="grid-bg relative overflow-hidden py-28 text-center">
      <div className="glow left-1/2 top-0 h-72 w-72 -translate-x-1/2 bg-yellow/30" />
      <div ref={root} className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-5">
        <h2 className="reveal m-0 text-4xl font-bold md:text-6xl">Hire your first <span className="text-grad">pixel team.</span></h2>
        <div className="reveal w-full max-w-xl"><CopyCommand big onCopied={onCopied} /></div>
        <div className="reveal flex flex-wrap justify-center gap-3 text-ink">
          <Magnetic><a className="px-btn inline-block bg-yellow px-5 py-2 font-bold no-underline" href="https://www.npmjs.com/package/@setupsworks/office">View on npm</a></Magnetic>
          <Magnetic><a className="px-btn inline-block bg-cream px-5 py-2 font-bold no-underline" href="https://github.com/Setups-Works/setups-works-office">Star on GitHub</a></Magnetic>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t-4 border-ink bg-navy-2 py-6 text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 text-sm">
        <span>Setups Works Office · MIT</span>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="px-btn bg-cream px-3 py-0.5 font-bold text-ink">↑ Back to top</button>
        <span>Built by <b>Setups Works</b></span>
      </div>
    </footer>
  );
}
