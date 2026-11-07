import { useLayoutEffect, useRef, useState } from "react";
import { agentPalette, colors } from "../../../src/theme/tokens";
import { Bot } from "../ui";
import { ScrollTrigger, gsap, reduced, useReveal } from "../fx";

const STEPS = [
  { t: "You brief the lead", p: "Tell it what to build. It writes a board of small tasks, each with the files it may touch, and hands them out.", cap: "Michael plans 3 tasks", cols: [0, 0, 0] },
  { t: "Workers build", p: "Each worker pulls main, branches, writes the code and opens a PR titled [TASK-ID] …, inside its own Docker Sandbox.", cap: "Dwight and Jim are coding", cols: [1, 1, 0] },
  { t: "PRs get reviewed", p: "The office follows pull requests on GitHub. Review comments go back to the author; a passing PR is reported to the lead.", cap: "PRs on the belt to review", cols: [2, 2, 1] },
  { t: "Agents ask when stuck", p: "A decision, a blocked website or a missing key lands in Action items. You answer, they carry on. You press merge.", cap: "Jim needs you", cols: [3, 3, 2] },
];
const NOTE = [colors.yellow, colors.blue, colors.pink];

function Scene({ step }: { step: number }) {
  const root = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const desks = [{ n: "MICHAEL", c: agentPalette[0], r: "#8a2f3c" }, { n: "DWIGHT", c: agentPalette[1], r: "#35568f" }, { n: "JIM", c: agentPalette[2], r: "#a8812b" }];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const dur = first.current || reduced() ? 0 : 0.5;
      gsap.utils.toArray<HTMLElement>(".s-note").forEach((el, i) => {
        gsap.to(el, { left: `${STEPS[step]!.cols[i]! * 25 + 2}%`, top: 24 + i * 16, duration: dur, ease: "steps(5)" });
      });
      gsap.to(".s-type", { opacity: step === 1 || step === 2 ? 1 : 0.15, duration: dur });
      gsap.to(".s-pr", { opacity: step === 2 ? 1 : 0, duration: dur });
      gsap.to(".s-ask", { scale: step === 3 ? 1 : 0, duration: reduced() ? 0 : 0.3, ease: "back.out(3)" });
      if (!reduced() && step === 2) gsap.fromTo(".s-pr", { left: "-12%" }, { left: "104%", duration: 3.2, ease: "none", repeat: -1, stagger: 1 });
      first.current = false;
    }, root);
    return () => ctx.revert();
  }, [step]);

  return (
    <div ref={root} className="px-box-dark">
      <div className="flex items-center gap-2 border-b-4 border-ink bg-cream px-3 py-1.5 text-ink sm:py-2">
        <span className="h-3 w-3 bg-red" /><span className="h-3 w-3 bg-yellow" /><span className="h-3 w-3 bg-green" />
        <b className="ml-2 text-sm">{STEPS[step]!.cap}</b>
        <span className="ml-auto text-xs font-bold">{step + 1}/4</span>
      </div>
      <div className="wood p-3 sm:p-4">
        <div className="relative mb-3 h-[92px] border-4 border-ink bg-cream text-ink sm:mb-4 sm:h-[104px]">
          <div className="grid grid-cols-4 border-b-2 border-ink text-center text-[9px] font-bold sm:text-[11px]">{["TODO", "DOING", "REVIEW", "DONE"].map((c) => <span key={c} className="py-0.5">{c}</span>)}</div>
          {NOTE.map((c, i) => <i key={i} className="s-note absolute block h-3 w-[16%] border-2 border-ink sm:h-3.5" style={{ background: c, left: "2%", top: 24 + i * 16 }} />)}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {desks.map((d, i) => (
            <div key={d.n} className="relative flex flex-col items-center border-4 border-ink pb-2 pt-3" style={{ background: d.r }}>
              {i === 2 && <span className="s-ask absolute -top-3 left-1/2 z-10 grid h-6 w-6 -translate-x-1/2 scale-0 place-items-center border-2 border-ink bg-red text-sm font-bold text-cream">!</span>}
              <div className="mb-1.5 flex h-7 w-11 items-center border-4 border-ink bg-navy-2 px-1 sm:mb-2 sm:h-9 sm:w-14"><span className="s-type type-bar block h-1 w-full bg-green" /></div>
              <Bot color={d.c!} size={0.95} />
              <em className="mt-1 border-2 border-ink bg-cream px-1 text-[9px] font-bold not-italic text-ink sm:text-[10px]">{d.n}</em>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 sm:mt-4">
          <div className="belt relative h-5 flex-1 overflow-hidden border-2 border-ink">
            {[0, 1].map((i) => <span key={i} className="s-pr absolute top-0.5 h-3 w-5 border-2 border-ink bg-cream text-center text-[8px] font-bold leading-none text-ink opacity-0">PR</span>)}
          </div>
          <div className="border-4 border-ink bg-[#4a4a58] px-2 py-1 text-[9px] font-bold text-cream sm:text-[10px]">CODERABBIT</div>
        </div>
      </div>
    </div>
  );
}

export function Story() {
  const root = useReveal<HTMLDivElement>();
  const [step, setStep] = useState(0);
  useLayoutEffect(() => {
    if (reduced() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".step-block").forEach((el, k) => ScrollTrigger.create({ trigger: el, start: "top 58%", end: "bottom 58%", onToggle: (st) => st.isActive && setStep(k) }));
    }, root);
    return () => ctx.revert();
  }, [root]);

  return (
    <section id="story" className="scroll-mt-14 border-y-4 border-ink bg-cream-2 py-16 sm:py-24">
      <div ref={root} className="mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-2xl">
          <span className="reveal px-btn inline-block bg-yellow px-2.5 py-0.5 text-sm font-bold uppercase tracking-widest">The loop</span>
          <h2 className="reveal mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl">One brief. Four steps. Scroll to watch.</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="sticky top-[60px] z-10 -mx-1 bg-cream-2 px-1 pb-2 pt-2 lg:top-24 lg:order-2 lg:self-start lg:bg-transparent lg:p-0">
            <Scene step={step} />
          </div>
          <div className="lg:order-1">
            {STEPS.map((s, k) => (
              <button key={s.t} onClick={() => { setStep(k); document.querySelectorAll(".step-block")[k]?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                className={`step-block reveal relative mb-5 block w-full border-4 border-ink p-5 text-left transition-colors lg:mb-0 lg:flex lg:min-h-[52vh] lg:flex-col lg:justify-center lg:border-0 lg:bg-transparent lg:p-0 ${step === k ? "bg-yellow" : "bg-cream"}`}>
                <span className={`mb-3 grid h-9 w-9 place-items-center border-[3px] border-ink text-lg font-bold ${step === k ? "bg-ink text-yellow" : "bg-cream"}`}>{k + 1}</span>
                <h3 className="m-0 text-2xl font-bold sm:text-3xl">{s.t}</h3>
                <p className="mb-0 mt-2 max-w-md text-lg text-muted">{s.p}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
