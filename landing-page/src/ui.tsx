import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { colors } from "../../src/theme/tokens";

export const INSTALL = "npx @setupsworks/office@latest";

export function Tree({ s = 56, className = "", style }: { s?: number; className?: string; style?: CSSProperties }) {
  return <i aria-hidden="true" className={`tree absolute block ${className}`} style={{ ["--s" as string]: `${s}px`, ...style }} />;
}

/** A section title in the app's HUD style: small yellow label, big cream heading with ink shadow. */
export function Heading({ label, title, sub, left }: { label: string; title: string; sub?: string; left?: boolean }) {
  return (
    <div className={`mb-10 max-w-2xl ${left ? "" : "mx-auto text-center"}`}>
      <span className="reveal px-btn inline-block bg-yellow px-2.5 py-0.5 text-sm font-bold uppercase tracking-widest">{label}</span>
      <h2 className="reveal ink-text mt-4 text-4xl font-bold leading-[1.05] text-cream sm:text-5xl">{title}</h2>
      {sub && <p className="reveal mt-3 text-lg text-cream">{sub}</p>}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<number>(0);
  const show = (m: string) => {
    setMsg(m);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setMsg(null), 1600);
  };
  const node = msg ? <div role="status" className="pop px-box fixed bottom-5 left-1/2 z-50 -translate-x-1/2 bg-yellow px-5 py-2 font-bold">{msg}</div> : null;
  return { show, node };
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyCommand({ text = INSTALL, onCopied }: { text?: string; onCopied: () => void }) {
  return (
    <button onClick={async () => { await copyText(text); onCopied(); }} aria-label={`Copy ${text}`}
      className="px-btn group flex w-full max-w-xl items-center gap-3 bg-navy-2 px-4 py-3 text-left text-cream">
      <span className="text-green">$</span>
      <code className="font-term min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xl">{text}</code>
      <span className="bg-cream px-2 py-0.5 text-sm font-bold text-ink group-hover:bg-yellow">copy</span>
    </button>
  );
}

/** A pixel robot built from divs, same proportions as the app's agents. */
export function Bot({ color, size = 1 }: { color: string; size?: number }) {
  const u = 6 * size;
  const eye = { position: "absolute" as const, top: u * 1.2, width: u * 0.8, height: u * 1.2, background: colors.cream };
  return (
    <div style={{ width: u * 5, height: u * 6, position: "relative" }}>
      <div style={{ position: "absolute", left: u * 2, top: 0, width: u, height: u, background: colors.yellow, border: `2px solid ${colors.ink}` }} />
      <div style={{ position: "absolute", left: 0, top: u, width: u * 5, height: u * 4, background: color, border: `3px solid ${colors.ink}` }}>
        <div style={{ ...eye, left: u * 0.7 }} /><div style={{ ...eye, right: u * 0.7 }} />
      </div>
      <div style={{ position: "absolute", left: u, top: u * 5, width: u, height: u, background: colors.ink }} />
      <div style={{ position: "absolute", left: u * 3, top: u * 5, width: u, height: u, background: colors.ink }} />
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-box ${className}`}>{children}</div>;
}
