import { useRef, useState, type ReactNode } from "react";
import { colors } from "../../src/theme/tokens";

export const INSTALL = "npx @setupsworks/office@latest";

export function Section({ id, alt, children }: { id?: string; alt?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 py-20 ${alt ? "bg-cream-2/95" : "grass-bg"}`}>
      <div className="mx-auto max-w-6xl px-5">{children}</div>
    </section>
  );
}

export function Heading({ chip, title, sub, dark }: { chip: string; title: string; sub?: string; dark?: boolean }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <span className="px-btn inline-block bg-yellow px-3 py-1 text-sm font-bold uppercase tracking-wider">{chip}</span>
      <h2 className={`mt-5 text-4xl font-bold leading-tight md:text-5xl ${dark ? "text-cream" : "text-ink"}`}>{title}</h2>
      {sub && <p className={`mt-3 text-lg ${dark ? "text-cream/90" : "text-muted"}`}>{sub}</p>}
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
  const node = msg ? (
    <div className="pop px-box fixed bottom-6 left-1/2 z-50 -translate-x-1/2 bg-yellow px-5 py-2 font-bold">{msg}</div>
  ) : null;
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

export function CopyCommand({ text = INSTALL, big, onCopied }: { text?: string; big?: boolean; onCopied: () => void }) {
  return (
    <button
      onClick={async () => {
        await copyText(text);
        onCopied();
      }}
      aria-label={`Copy ${text}`}
      className={`px-btn group flex w-full max-w-xl items-center gap-3 bg-navy-2 text-left text-cream ${big ? "px-5 py-4 text-xl" : "px-4 py-3 text-lg"}`}
    >
      <span className="text-green">$</span>
      <code className="font-term flex-1 overflow-x-auto whitespace-nowrap text-[1.25em]">{text}</code>
      <span className="bg-cream px-2 py-0.5 text-sm font-bold text-ink group-hover:bg-yellow">copy</span>
    </button>
  );
}

/** A little pixel robot, drawn with divs so it scales crisply. */
export function Bot({ color, bob, size = 1 }: { color: string; bob?: boolean; size?: number }) {
  const u = 6 * size;
  return (
    <div className={bob ? "bob" : ""} style={{ width: u * 5, height: u * 6, position: "relative" }}>
      <div style={{ position: "absolute", left: u * 2, top: 0, width: u, height: u, background: colors.yellow, border: `2px solid ${colors.ink}` }} />
      <div style={{ position: "absolute", left: 0, top: u, width: u * 5, height: u * 4, background: color, border: `3px solid ${colors.ink}` }}>
        <div style={{ position: "absolute", left: u * 0.7, top: u * 1.2, width: u * 0.8, height: u * 1.2, background: colors.cream }} />
        <div style={{ position: "absolute", right: u * 0.7, top: u * 1.2, width: u * 0.8, height: u * 1.2, background: colors.cream }} />
      </div>
      <div style={{ position: "absolute", left: u, top: u * 5, width: u, height: u, background: colors.ink }} />
      <div style={{ position: "absolute", left: u * 3, top: u * 5, width: u, height: u, background: colors.ink }} />
    </div>
  );
}
