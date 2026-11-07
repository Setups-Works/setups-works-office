import { useEffect, useState } from "react";
import { FONT_STYLES, applyFont, savedFont, setFont, type FontStyle } from "../../../src/theme/fonts";

const LINKS = [
  ["Live demo", "#demo"],
  ["How it works", "#how"],
  ["Why", "#why"],
  ["Get started", "#start"],
  ["FAQ", "#faq"],
] as const;

export function Nav() {
  const [font, setF] = useState<FontStyle>(savedFont());
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const pick = (f: FontStyle) => {
    setFont(f);
    applyFont(f);
    setF(f);
  };
  return (
    <header className={`sticky top-0 z-40 border-b-4 border-ink bg-cream transition-shadow ${scrolled ? "shadow-[0_4px_0_rgba(36,26,46,.25)]" : ""}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <a href="#top" className="flex items-center gap-2 text-xl font-bold no-underline">
          <span className="grid h-8 w-8 place-items-center border-[3px] border-ink bg-blue">
            <span className="block h-2 w-2 bg-cream" />
          </span>
          <span className="hidden sm:inline">Setups Works Office</span>
        </a>
        <nav className="ml-auto hidden gap-5 md:flex" aria-label="Main">
          {LINKS.map(([l, h]) => (
            <a key={h} href={h} className="font-semibold no-underline hover:underline">
              {l}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <div className="flex" role="group" aria-label="Font style">
            {FONT_STYLES.map((f) => (
              <button
                key={f.id}
                title={`${f.label}: ${f.hint}`}
                onClick={() => pick(f.id)}
                className={`border-2 border-ink px-2 py-0.5 text-sm font-bold ${font === f.id ? "bg-yellow" : "bg-cream hover:bg-cream-2"}`}
                style={{ fontFamily: f.id === "pixel" ? '"Pixelify Sans"' : f.id === "clean" ? "Inter" : '"JetBrains Mono"' }}
              >
                Aa
              </button>
            ))}
          </div>
          <a className="px-btn bg-yellow px-3 py-1 font-bold no-underline" href="https://github.com/Setups-Works/setups-works-office">
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
