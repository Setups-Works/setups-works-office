import { useLayoutEffect, useRef, useState } from "react";
import { Heading, Section, copyText } from "../ui";
import { Magnetic, ScrollTrigger, gsap, reduced, spotlight, useReveal } from "../fx";

const CMDS = {
  npx: ["# run once, no install", "npx @setupsworks/office@latest"],
  npm: ["# install globally", "npm install -g @setupsworks/office", "setups-works-office"],
  pnpm: ["# install globally", "pnpm add -g @setupsworks/office", "setups-works-office"],
} as const;
const REQ = [
  ["Node.js 20+", "runs the office"], ["git + a GitHub repo", "agents clone it and open PRs"], ["GitHub CLI (gh)", "reads PRs and reviews"],
  ["Docker Sandboxes (sbx)", "one VM per agent"], ["tmux (macOS, Linux)", "agents survive closing the office"], ["A Claude or ChatGPT account", "for the agents themselves"],
];

export function GetStarted({ onCopied }: { onCopied: () => void }) {
  const root = useReveal<HTMLDivElement>();
  const [tab, setTab] = useState<keyof typeof CMDS>("npx");
  const [have, setHave] = useState<boolean[]>(REQ.map(() => false));
  const term = useRef<HTMLPreElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const n = have.filter(Boolean).length;
  const lines = CMDS[tab];
  const cmds = lines.filter((l) => !l.startsWith("#"));

  // Typewriter: retype the commands whenever the tab changes or the terminal scrolls into view.
  useLayoutEffect(() => {
    const el = term.current;
    if (!el) return;
    const full = lines.join("\n");
    if (reduced()) { el.textContent = full; return; }
    const o = { n: 0 };
    el.textContent = "";
    const tw = gsap.to(o, { n: full.length, duration: full.length * 0.035, ease: "none", paused: true, onUpdate: () => { el.textContent = full.slice(0, Math.round(o.n)); } });
    const st = ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => tw.play() });
    if (st.progress > 0 || ScrollTrigger.isInViewport(el)) tw.play();
    return () => { st.kill(); tw.kill(); };
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    gsap.to(meter.current, { scaleX: n / REQ.length, duration: 0.5, ease: "elastic.out(1,0.6)" });
  }, [n]);

  return (
    <Section id="start" alt>
      <div ref={root}>
        <Heading chip="Get started" title="Running in about two minutes." sub="From inside a git repo that has a GitHub remote." />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="reveal px-box-dark p-4">
            <div className="mb-3 flex gap-2">
              {(Object.keys(CMDS) as (keyof typeof CMDS)[]).map((k) => (
                <button key={k} onClick={() => setTab(k)} className={`border-2 border-ink px-3 py-0.5 font-bold ${tab === k ? "bg-yellow text-ink" : "bg-navy-2 text-cream"}`}>{k}</button>
              ))}
            </div>
            <pre ref={term} className="font-term caret m-0 min-h-28 whitespace-pre-wrap text-xl leading-snug text-green" />
            <Magnetic><button className="px-btn mt-3 bg-yellow px-4 py-1 font-bold text-ink" onClick={async () => { await copyText(cmds.join("\n")); onCopied(); }}>Copy command</button></Magnetic>
          </div>
          <div className="reveal glass p-5" onMouseMove={spotlight}>
            <h4 className="m-0 mb-3 text-xl font-bold">What you need</h4>
            <ul className="m-0 grid list-none gap-2 p-0">
              {REQ.map(([t, d], k) => (
                <li key={t}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" className="mt-1.5 h-4 w-4 accent-green" checked={have[k]} onChange={() => setHave((h) => h.map((v, j) => (j === k ? !v : v)))} />
                    <span><b>{t}</b> <span className="text-cream/60">· {d}</span></span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-4 h-3 border-2 border-ink bg-white/10"><div ref={meter} className="h-full origin-left scale-x-0 bg-green" /></div>
            <div className={`mt-3 border-4 border-ink px-3 py-2 font-bold ${n === REQ.length ? "bg-green text-ink" : "bg-white/10"}`}>
              {n === REQ.length ? "You're ready. Run the command!" : `${n} of ${REQ.length} ticked. The office checks the rest and shows the fix.`}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
