import { useRef } from "react";
import { CopyCommand, Tree } from "../ui";
import { gsap, reduced, useReveal } from "../fx";

const FAQ = [
  ["Does it merge code for me?", "No. The office follows pull requests on GitHub and reports their status, but merging is always yours."],
  ["Where does the code run?", "Everything runs on your machine. Each agent gets its own Docker Sandbox (a small VM). Where sandboxes aren't supported, set agents to Local in Settings → Team and they run directly, with permission prompts on."],
  ["Is there a desktop app?", "Yes. On macOS (14 or newer, Apple silicon and Intel) it's a native app with a sidebar, menu bar item and notifications. On Windows it's an installer. Both run the same server on a free localhost port in their own window and update themselves. Linux uses the npx command."],
  ["Which platforms are supported?", "Sandboxes need macOS 14+ on Apple silicon, Windows 11, or Ubuntu 24.04+. Local mode works elsewhere."],
  ["Which agents can I use?", "Claude Code or Codex, chosen per agent for the lead and each worker."],
  ["Can I try it without risk?", "Yes. Use a throwaway repo: git init -b main, add a README, commit, then run the command above."],
];

function Item({ q, a, open }: { q: string; a: string; open?: boolean }) {
  const body = useRef<HTMLDivElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const on = useRef(!!open);
  const toggle = () => {
    on.current = !on.current;
    const d = reduced() ? 0 : 0.3;
    gsap.to(body.current, { height: on.current ? "auto" : 0, duration: d, ease: "steps(6)" });
    gsap.to(arrow.current, { rotate: on.current ? 90 : 0, duration: d });
  };
  return (
    <div className="reveal px-box">
      <button onClick={toggle} className="flex w-full items-center gap-3 p-4 text-left text-lg font-bold">
        <span ref={arrow} className="inline-block text-sm" style={{ transform: open ? "rotate(90deg)" : undefined }}>▶</span>{q}
      </button>
      <div ref={body} className="overflow-hidden" style={{ height: open ? "auto" : 0 }}><p className="m-0 px-4 pb-4 text-lg text-muted">{a}</p></div>
    </div>
  );
}

export function Faq() {
  const root = useReveal<HTMLDivElement>();
  return (
    <section id="faq" className="scroll-mt-14 border-t-4 border-ink bg-cream-2 py-16 sm:py-24">
      <div ref={root} className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <span className="reveal px-btn inline-block bg-yellow px-2.5 py-0.5 text-sm font-bold uppercase tracking-widest">FAQ</span>
          <h2 className="reveal mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl">Good questions.</h2>
        </div>
        <div className="grid gap-3">{FAQ.map(([q, a], i) => <Item key={q} q={q} a={a} open={i === 0} />)}</div>
      </div>
    </section>
  );
}

export function Footer({ onCopied }: { onCopied: () => void }) {
  const root = useReveal<HTMLDivElement>();
  return (
    <footer className="lawn relative overflow-hidden border-t-4 border-ink pt-20">
      <Tree s={60} className="hidden md:block" style={{ left: "5%", top: "15%" }} />
      <Tree s={48} className="hidden md:block" style={{ right: "6%", top: "30%" }} />
      <div ref={root} className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 text-center">
        <h2 className="reveal ink-text m-0 text-4xl font-bold text-cream sm:text-6xl">Hire your first <span className="text-yellow">pixel team.</span></h2>
        <div className="reveal flex w-full justify-center"><CopyCommand onCopied={onCopied} /></div>
        <div className="reveal flex flex-wrap justify-center gap-3">
          <a className="px-btn bg-yellow px-5 py-2 font-bold no-underline" href="https://www.npmjs.com/package/@setupsworks/office">View on npm</a>
          <a className="px-btn bg-cream px-5 py-2 font-bold no-underline" href="https://github.com/Setups-Works/setups-works-office">Star on GitHub</a>
        </div>
      </div>
      <div className="mt-16 border-t-4 border-ink bg-navy-2 py-5 text-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm">
          <span>Setups Works Office · MIT</span>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="px-btn bg-cream px-3 py-0.5 font-bold text-ink">↑ Top</button>
          <span>Built by <b>Setups Works</b></span>
        </div>
      </div>
    </footer>
  );
}
