import { useEffect, useRef, useState } from "react";
import { FONT_STYLES, applyFont, savedFont, setFont, type FontStyle } from "../../../src/theme/fonts";
import { Magnetic, gsap } from "../fx";

const LINKS = [["Live demo", "#demo"], ["How it works", "#how"], ["Why", "#why"], ["Get started", "#start"], ["FAQ", "#faq"]] as const;

export function Nav() {
  const [font, setF] = useState<FontStyle>(savedFont());
  const [active, setActive] = useState("");
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      gsap.to(ref.current, { yPercent: y > last && y > 120 ? -110 : 0, duration: 0.35, ease: "power2.out", overwrite: true });
      last = y;
      let cur = "";
      for (const [, h] of LINKS) {
        const el = document.querySelector(h);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = h;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", on, { passive: true });
    gsap.from(ref.current, { yPercent: -100, duration: 0.7, ease: "power3.out", delay: 0.1 });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const pick = (f: FontStyle) => { setFont(f); applyFont(f); setF(f); };

  return (
    <header ref={ref} className="fixed inset-x-0 top-0 z-40 border-b-4 border-ink bg-navy-2/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-2.5">
        <a href="#top" className="flex items-center gap-2 text-xl font-bold no-underline">
          <span className="grid h-8 w-8 place-items-center border-[3px] border-ink bg-blue"><span className="block h-2 w-2 bg-cream" /></span>
          <span className="hidden sm:inline">Setups Works Office</span>
        </a>
        <nav className="ml-auto hidden gap-1 md:flex" aria-label="Main">
          {LINKS.map(([l, h]) => (
            <a key={h} href={h} className={`px-3 py-1 font-semibold no-underline transition-colors ${active === h ? "bg-yellow text-ink" : "hover:bg-white/10"}`}>{l}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <div className="flex" role="group" aria-label="Font style">
            {FONT_STYLES.map((f) => (
              <button key={f.id} title={`${f.label}: ${f.hint}`} onClick={() => pick(f.id)}
                className={`border-2 border-ink px-2 py-0.5 text-sm font-bold ${font === f.id ? "bg-yellow text-ink" : "bg-cream/10 hover:bg-cream/20"}`}
                style={{ fontFamily: f.id === "pixel" ? '"Pixelify Sans"' : f.id === "clean" ? "Inter" : '"JetBrains Mono"' }}>Aa</button>
            ))}
          </div>
          <Magnetic><a className="px-btn bg-yellow px-3 py-1 font-bold text-ink no-underline" href="https://github.com/Setups-Works/setups-works-office">GitHub</a></Magnetic>
        </div>
      </div>
    </header>
  );
}
