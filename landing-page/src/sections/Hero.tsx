import { useLayoutEffect, useRef, useState } from "react";
import { agentPalette, colors } from "../../../src/theme/tokens";
import { Bot, CopyCommand, Tree } from "../ui";
import { gsap, reduced } from "../fx";

const QUIPS = ["On it! ⌨", "PR incoming ⎇", "Tests green ✓", "Need a decision!", "Coffee? ☕", "Shipping… 🚀"];

function Office() {
  const root = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState<{ i: number; t: string } | null>(null);
  const desks = [
    { name: "MICHAEL", color: agentPalette[0], rug: "#8a2f3c", lead: true },
    { name: "DWIGHT", color: agentPalette[1], rug: "#35568f" },
    { name: "JIM", color: agentPalette[2], rug: "#a8812b" },
  ];
  useLayoutEffect(() => {
    if (reduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(".o-desk", { y: 50, opacity: 0, stagger: 0.12, duration: 0.5, ease: "steps(5)", delay: 0.5 });
      gsap.to(".o-note.hop", { x: 40, duration: 1.1, ease: "steps(4)", repeat: -1, yoyo: true, repeatDelay: 1.4 });
      gsap.to(".o-type", { scaleX: 0.25, duration: 0.45, ease: "steps(3)", repeat: -1, yoyo: true, stagger: 0.18 });
      gsap.fromTo(".o-pr", { left: "-12%" }, { left: "104%", duration: 4.2, ease: "none", repeat: -1, stagger: 1.4 });
      gsap.to(".o-bot", { y: -4, duration: 0.6, ease: "steps(2)", repeat: -1, yoyo: true, stagger: 0.2 });
    }, root);
    return () => ctx.revert();
  }, []);
  const poke = (i: number) => {
    const bot = root.current?.querySelectorAll(".o-bot")[i];
    if (bot) gsap.fromTo(bot, { y: 0 }, { y: -26, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", overwrite: false });
    setBubble({ i, t: QUIPS[Math.floor(Math.random() * QUIPS.length)]! });
    window.setTimeout(() => setBubble((b) => (b?.i === i ? null : b)), 1400);
  };
  return (
    <div ref={root} className="px-box-dark w-full max-w-[520px]" role="group" aria-label="Pixel office preview. Click an agent.">
      <div className="flex items-center gap-2 border-b-4 border-ink bg-cream px-3 py-2 text-ink">
        <span className="h-3 w-3 bg-red" /><span className="h-3 w-3 bg-yellow" /><span className="h-3 w-3 bg-green" />
        <b className="ml-2 text-sm">Setups Works Office</b>
        <span className="ml-auto border-2 border-ink bg-yellow px-2 text-xs font-bold">Click an agent</span>
      </div>
      <div className="wood p-3 sm:p-4">
        <div className="mb-4 flex items-start gap-2 text-ink sm:gap-3">
          <div className="flex min-w-0 flex-1 gap-1 border-4 border-ink bg-cream p-2">
            {["TODO", "DOING", "REVIEW", "DONE"].map((c, i) => (
              <div key={c} className="min-w-0 flex-1">
                <div className="truncate text-[9px] font-bold sm:text-[10px]">{c}</div>
                <div className="mt-1 flex h-5 flex-wrap gap-1">
                  {Array.from({ length: i === 0 ? 2 : 0 }).map((_, k) => <i key={k} className={`o-note block h-2 w-3 ${k === 0 ? "hop" : ""}`} style={{ background: [colors.yellow, colors.blue][k % 2] }} />)}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden border-4 border-ink bg-[#a8642c] px-3 py-2 text-center text-sm font-bold text-cream sm:block">SETUPS WORKS</div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {desks.map((d, i) => (
            <button key={d.name} onClick={() => poke(i)} aria-label={`Poke ${d.name}`} className="o-desk relative flex flex-col items-center border-4 border-ink pb-2 pt-3" style={{ background: d.rug }}>
              {bubble?.i === i && <span className="pop absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap border-2 border-ink bg-white px-2 py-0.5 text-[11px] font-bold text-ink">{bubble.t}</span>}
              <div className="mb-2 flex h-8 w-12 items-center border-4 border-ink bg-navy-2 px-1 sm:h-9 sm:w-14"><span className="o-type block h-1 w-full origin-left bg-green" /></div>
              <div className="o-bot"><Bot color={d.color} size={1.05} /></div>
              <em className="mt-1 border-2 border-ink bg-cream px-1 text-[9px] font-bold not-italic text-ink sm:text-[10px]">{d.name}</em>
              {d.lead && <span className="absolute -top-2 right-1 text-xs">♛</span>}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="belt relative h-5 flex-1 overflow-hidden border-2 border-ink">
            {[0, 1, 2].map((i) => <span key={i} className="o-pr absolute top-0.5 h-3 w-5 border-2 border-ink bg-cream text-center text-[8px] font-bold leading-none text-ink">PR</span>)}
          </div>
          <div className="border-4 border-ink bg-[#4a4a58] px-2 py-1 text-[9px] font-bold text-cream sm:text-[10px]">CODERABBIT</div>
        </div>
      </div>
    </div>
  );
}

export function Hero({ onCopied }: { onCopied: () => void }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reduced()) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "steps(6)" } })
        .from(".h-in", { y: 30, opacity: 0, duration: 0.5, stagger: 0.1 })
        .from(".h-tree", { scale: 0, duration: 0.4, stagger: 0.06, ease: "back.out(2)" }, 0.2);
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={root} id="top" className="lawn relative overflow-hidden pb-20 pt-28 sm:pt-32">
      {[["8%", "14%", 64], ["3%", "62%", 48], ["94%", "10%", 56], ["90%", "70%", 72], ["52%", "93%", 44]].map(([l, t, s], i) => (
        <Tree key={i} s={s as number} className="h-tree hidden md:block" style={{ left: l as string, top: t as string }} />
      ))}
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="h-in px-btn inline-block bg-yellow px-3 py-1 text-sm font-bold">v0.7 · runs on your machine</span>
          <h1 className="h-in ink-text mt-5 text-[2.6rem] font-bold leading-[1.02] text-cream sm:text-6xl">Run a team of AI coders. <span className="text-yellow">Watch them work.</span></h1>
          <div className="h-in px-box mt-6 max-w-xl p-4 text-lg sm:text-xl">
            One <b>lead</b> agent plans the work. Each <b>worker</b> gets its own desk, its own copy of your repo and its own Docker Sandbox, then opens a pull request.
          </div>
          <div className="h-in mt-6 flex flex-wrap gap-3">
            <a href="#playground" className="px-btn bg-yellow px-5 py-2.5 text-lg font-bold no-underline">Try the app ↓</a>
            <a href="#start" className="px-btn bg-cream px-5 py-2.5 text-lg font-bold no-underline">Install</a>
          </div>
          <div className="h-in mt-5"><CopyCommand onCopied={onCopied} /></div>
          <div className="h-in mt-4 flex flex-wrap items-center gap-2 text-cream">
            <span>Works with</span>
            <b className="border-2 border-ink bg-blue px-2 text-ink">Claude Code</b>
            <b className="border-2 border-ink bg-green px-2 text-ink">Codex</b>
          </div>
        </div>
        <div className="h-in flex justify-center lg:justify-end"><Office /></div>
      </div>
    </section>
  );
}
