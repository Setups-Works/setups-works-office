import { useEffect, useState } from "react";
import { FONT_STYLES, applyFont, savedFont, setFont, type FontStyle } from "../../../src/theme/fonts";

const LINKS = [["Story", "#story"], ["Playground", "#playground"], ["Why", "#why"], ["Download", "#download"], ["Install", "#start"], ["FAQ", "#faq"]] as const;

export function Nav() {
  const [font, setF] = useState<FontStyle>(savedFont());
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const on = () => setStuck(window.scrollY > 4);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const pick = (f: FontStyle) => { setFont(f); applyFont(f); setF(f); };

  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b-4 border-ink bg-cream ${stuck ? "shadow-[0_4px_0_rgba(36,26,46,.25)]" : ""}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <a href="#top" className="flex items-center gap-2 text-lg font-bold no-underline sm:text-xl">
          <span className="grid h-8 w-8 place-items-center border-[3px] border-ink bg-blue"><span className="block h-2 w-2 bg-cream" /></span>
          Setups Works Office
        </a>
        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map(([l, h]) => <a key={h} href={h} className="px-3 py-1 font-semibold no-underline hover:bg-yellow">{l}</a>)}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <div className="hidden sm:flex" role="group" aria-label="Font style">
            {FONT_STYLES.map((f) => (
              <button key={f.id} title={`${f.label}: ${f.hint}`} onClick={() => pick(f.id)} className={`border-2 border-ink px-2 py-0.5 text-sm font-bold ${font === f.id ? "bg-yellow" : "bg-cream hover:bg-cream-2"}`}
                style={{ fontFamily: f.id === "pixel" ? '"Pixelify Sans"' : f.id === "clean" ? "Inter" : '"JetBrains Mono"' }}>Aa</button>
            ))}
          </div>
          <a href="#playground" className="px-btn hidden bg-yellow px-3 py-1 font-bold no-underline sm:block">Try it</a>
          <button className="px-btn bg-cream px-2.5 py-1 font-bold lg:hidden" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button>
        </div>
      </div>
      {open && (
        <nav className="border-t-4 border-ink bg-cream px-4 pb-4 pt-2 lg:hidden" aria-label="Mobile">
          {LINKS.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block border-b-2 border-cream-3 py-3 text-lg font-bold no-underline">{l}</a>)}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted">Font</span>
            {FONT_STYLES.map((f) => <button key={f.id} onClick={() => pick(f.id)} className={`border-2 border-ink px-3 py-1 text-sm font-bold ${font === f.id ? "bg-yellow" : "bg-cream"}`}>{f.label}</button>)}
          </div>
        </nav>
      )}
    </header>
  );
}
