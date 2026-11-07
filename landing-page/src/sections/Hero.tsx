import { useLayoutEffect, useRef, useState } from "react";
import { agentPalette, colors } from "../../../src/theme/tokens";
import { Bot, CopyCommand } from "../ui";
import { Magnetic, gsap, reduced } from "../fx";

const QUIPS = ["On it! ⌨", "PR incoming ⎇", "Tests green ✓", "Need a decision!", "Coffee break? ☕", "Shipping… 🚀"];

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
      gsap.from(".o-desk", { y: 60, opacity: 0, scale: 0.8, stagger: 0.15, duration: 0.7, ease: "back.out(1.6)", delay: 0.7 });
      gsap.from(".o-note", { scale: 0, stagger: 0.07, duration: 0.3, ease: "back.out(3)", delay: 1.1 });
      // sticky notes hop across the board columns
      gsap.to(".o-note.hop", { x: 38, duration: 1.2, ease: "steps(4)", repeat: -1, yoyo: true, repeatDelay: 1.2 });
      // monitors "type"
      gsap.to(".o-type", { scaleX: 0.25, duration: 0.45, ease: "steps(3)", repeat: -1, yoyo: true, stagger: 0.18 });
      // PR packets ride the belt
      gsap.fromTo(".o-pr", { left: "-12%" }, { left: "104%", duration: 4.2, ease: "none", repeat: -1, stagger: 1.4 });
      // robots idle bob, desynced
      gsap.to(".o-bot", { y: -4, duration: 0.6, ease: "steps(2)", repeat: -1, yoyo: true, stagger: 0.2 });
    }, root);

    // pointer tilt
    const el = root.current!;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
    const mv = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - (r.left + r.width / 2)) / r.width) * 10);
      rx((-(e.clientY - (r.top + r.height / 2)) / r.height) * 10);
    };
    const lv = () => { rx(0); ry(0); };
    el.addEventListener("mousemove", mv);
    el.addEventListener("mouseleave", lv);
    return () => { el.removeEventListener("mousemove", mv); el.removeEventListener("mouseleave", lv); ctx.revert(); };
  }, []);

  const poke = (i: number) => {
    const bot = root.current?.querySelectorAll(".o-bot")[i];
    if (bot) gsap.fromTo(bot, { y: 0 }, { y: -26, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", overwrite: false });
    setBubble({ i, t: QUIPS[Math.floor(Math.random() * QUIPS.length)]! });
    window.setTimeout(() => setBubble((b) => (b?.i === i ? null : b)), 1400);
  };

  return (
    <div style={{ perspective: 1000 }} className="relative">
      <div ref={root} className="px-box-dark overflow-hidden will-change-transform" style={{ transformStyle: "preserve-3d" }} role="img" aria-label="Animated pixel office preview. Click an agent.">
        <div className="flex items-center gap-2 border-b-4 border-ink bg-cream px-3 py-2 text-ink">
          <span className="h-3 w-3 bg-red" /><span className="h-3 w-3 bg-yellow" /><span className="h-3 w-3 bg-green" />
          <b className="ml-2 text-sm">Setups Works Office</b>
          <span className="ml-auto border-2 border-ink bg-yellow px-2 text-xs font-bold">Click an agent!</span>
        </div>
        <div className="relative p-4" style={{ background: "#c98f4f", backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 2px, transparent 2px 36px)" }}>
          <div className="mb-4 flex items-start gap-3 text-ink">
            <div className="flex flex-1 gap-1 border-4 border-ink bg-cream p-2">
              {["TODO", "DOING", "REVIEW", "DONE"].map((c, i) => (
                <div key={c} className="relative flex-1">
                  <div className="text-[10px] font-bold">{c}</div>
                  <div className="mt-1 flex h-5 flex-wrap gap-1">
                    {Array.from({ length: i === 0 ? 2 : 0 }).map((_, k) => (
                      <i key={k} className={`o-note block h-2 w-3 ${k === 0 ? "hop" : ""}`} style={{ background: [colors.yellow, colors.blue][k % 2] }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-4 border-ink bg-[#a8642c] px-3 py-2 text-center text-sm font-bold text-cream">SETUPS WORKS</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {desks.map((d, i) => (
              <button key={d.name} onClick={() => poke(i)} aria-label={`Poke ${d.name}`} className="o-desk relative flex cursor-pointer flex-col items-center border-4 border-ink pb-2 pt-3" style={{ background: d.rug }}>
                {bubble?.i === i && <span className="pop absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap border-2 border-ink bg-white px-2 py-0.5 text-[11px] font-bold text-ink">{bubble.t}</span>}
                <div className="mb-2 flex h-9 w-14 items-center border-4 border-ink bg-navy-2 px-1"><span className="o-type block h-1 w-full origin-left bg-green" /></div>
                <div className="o-bot"><Bot color={d.color} size={1.1} /></div>
                <em className="mt-1 border-2 border-ink bg-cream px-1 text-[10px] font-bold not-italic text-ink">{d.name}</em>
                {d.lead && <span className="absolute -top-2 right-1 text-xs">♛</span>}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="belt relative h-5 flex-1 overflow-hidden border-2 border-ink">
              {[0, 1, 2].map((i) => <span key={i} className="o-pr absolute top-0.5 h-3 w-5 border-2 border-ink bg-cream text-center text-[8px] font-bold leading-none text-ink">PR</span>)}
            </div>
            <div className="border-4 border-ink bg-[#4a4a58] px-2 py-1 text-[10px] font-bold text-cream">CODERABBIT</div>
          </div>
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
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".h-chip", { y: -20, opacity: 0, duration: 0.5 })
        .from(".h-word", { yPercent: 110, opacity: 0, rotate: 6, duration: 0.7, stagger: 0.06 }, "-=0.2")
        .from(".h-sub", { y: 24, opacity: 0, duration: 0.6 }, "-=0.3")
        .from(".h-cta > *", { y: 24, opacity: 0, scale: 0.9, duration: 0.5, stagger: 0.1, ease: "back.out(2)" }, "-=0.3")
        .from(".h-cmd", { y: 24, opacity: 0, duration: 0.5 }, "-=0.2")
        .from(".h-with > *", { opacity: 0, x: -12, stagger: 0.08, duration: 0.4 }, "-=0.2");
      // floating pixels
      gsap.utils.toArray<HTMLElement>(".px-float").forEach((el, i) => {
        gsap.to(el, { y: gsap.utils.random(-40, 40), x: gsap.utils.random(-30, 30), rotation: gsap.utils.random(-90, 90), duration: gsap.utils.random(3, 6), repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.1 });
      });
      // parallax on scroll
      gsap.to(".hero-glow", { yPercent: 40, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  const words = (t: string, cls = "") => t.split(" ").map((w, i) => (
    <span key={i} className="inline-block overflow-hidden pb-1 align-bottom"><span className={`h-word inline-block ${cls}`}>{w}&nbsp;</span></span>
  ));
  const palette = [colors.yellow, colors.pink, colors.blue, colors.green, colors.orange, colors.lav];

  return (
    <section ref={root} id="top" className="grid-bg relative overflow-hidden pb-24 pt-36">
      <div className="hero-glow glow -left-20 top-0 h-96 w-96 bg-blue/50" />
      <div className="hero-glow glow right-0 top-40 h-96 w-96 bg-pink/40" />
      {Array.from({ length: 16 }).map((_, i) => (
        <i key={i} className="px-float pointer-events-none absolute block h-2.5 w-2.5" style={{ left: `${(i * 37) % 97}%`, top: `${(i * 53) % 90}%`, background: palette[i % palette.length], opacity: 0.5 }} />
      ))}
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <span className="h-chip px-btn inline-block bg-yellow px-3 py-1 text-sm font-bold text-ink">v0.7 · runs on your machine</span>
          <h1 className="mt-5 text-5xl font-bold leading-[1.05] md:text-6xl">
            {words("Your AI coding team,")}
            {words("in a pixel office.", "text-grad")}
          </h1>
          <p className="h-sub mt-5 max-w-xl text-xl text-cream/80">
            One <b className="text-yellow">lead</b> agent plans the work. Each <b className="text-blue">worker</b> gets its own desk, its own copy of your repo and its own Docker Sandbox, then opens a pull request. You watch it all happen.
          </p>
          <div className="h-cta mt-7 flex flex-wrap gap-3 text-ink">
            <Magnetic><a href="#start" className="px-btn inline-block bg-yellow px-5 py-2.5 text-lg font-bold no-underline">Get started</a></Magnetic>
            <Magnetic><a href="#demo" className="px-btn inline-block bg-cream px-5 py-2.5 text-lg font-bold no-underline">Try the live demo ↓</a></Magnetic>
          </div>
          <div className="h-cmd mt-6"><CopyCommand onCopied={onCopied} /></div>
          <div className="h-with mt-5 flex items-center gap-2 text-cream/80">
            <span>Works with</span>
            <b className="border-2 border-ink bg-blue px-2 text-ink">Claude Code</b>
            <b className="border-2 border-ink bg-green px-2 text-ink">Codex</b>
          </div>
        </div>
        <Office />
      </div>
    </section>
  );
}
