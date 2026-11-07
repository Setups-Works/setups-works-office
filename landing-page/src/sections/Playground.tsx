import { useEffect, useRef, useState } from "react";
import { Heading, Tree } from "../ui";
import { useReveal } from "../fx";

const APP_W = 1280;
const APP_H = 800;
const SRC = `${import.meta.env.BASE_URL}playground/`;
const TIPS = ["Click an agent card to open its terminal", "Answer Jim in Action items", "Boards, PRs and Settings all work", "Press 1–3 to open agents, + / − to zoom", "Pick 2x or 4x to speed up the sim"];

export function Playground() {
  const root = useReveal<HTMLDivElement>();
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [live, setLive] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / APP_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setLive(true), { rootMargin: "300px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  const small = scale < 0.62; // phones and small tablets: the app is a desktop UI, so open it full screen instead

  return (
    <section id="playground" className="lawn relative scroll-mt-14 overflow-hidden py-16 sm:py-24">
      <Tree s={60} className="hidden md:block" style={{ left: "2%", top: "8%" }} />
      <Tree s={48} className="hidden md:block" style={{ right: "3%", top: "20%" }} />
      <div ref={root} className="relative mx-auto max-w-6xl px-4">
        <Heading label="Playground" title="Test the whole app. Right here." sub="This is the real Setups Works Office running on demo data. Nothing to install, nothing leaves your browser." />
        <div className="reveal mb-4 flex flex-wrap items-center justify-center gap-2">
          {TIPS.map((t) => <span key={t} className="border-2 border-ink bg-cream px-2 py-0.5 text-sm font-bold">{t}</span>)}
        </div>
        <div className="reveal px-box-dark">
          <div className="flex flex-wrap items-center gap-2 border-b-4 border-ink bg-cream px-3 py-2 text-ink">
            <span className="h-3 w-3 bg-red" /><span className="h-3 w-3 bg-yellow" /><span className="h-3 w-3 bg-green" />
            <code className="ml-2 hidden border-2 border-ink bg-white px-2 text-sm sm:block">localhost:7420 · demo data</code>
            <div className="ml-auto flex gap-2">
              <button onClick={() => { setRun((r) => r + 1); setLive(true); }} className="px-btn bg-cream px-3 py-0.5 text-sm font-bold">↻ Reset</button>
              <a href={SRC} target="_blank" rel="noreferrer" className="px-btn bg-yellow px-3 py-0.5 text-sm font-bold no-underline">⛶ Full screen</a>
            </div>
          </div>
          <div ref={wrap} className="relative w-full overflow-hidden bg-grass" style={small ? undefined : { height: APP_H * scale }}>
            {small ? (
              <div className="wood grid place-items-center px-4 py-8 text-center">
                <div className="px-box max-w-xs p-4">
                  <b className="text-lg">The app is built for a big screen.</b>
                  <p className="mb-3 mt-1 text-sm text-muted">Open the full playground in its own tab, then rotate your phone or use a laptop.</p>
                  <a href={SRC} target="_blank" rel="noreferrer" className="px-btn inline-block bg-yellow px-4 py-2 font-bold no-underline">Open playground ⛶</a>
                </div>
              </div>
            ) : live ? (
              <iframe key={run} title="Setups Works Office playground" src={SRC} loading="lazy" className="absolute left-0 top-0 border-0" style={{ width: APP_W, height: APP_H, transform: `scale(${scale})`, transformOrigin: "0 0" }} />
            ) : (
              <div className="wood grid h-full place-items-center"><b className="blink text-xl">Loading office…</b></div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
