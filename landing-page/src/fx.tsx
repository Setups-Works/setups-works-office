import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fade/slide children marked .reveal in when they scroll into view. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.batch(".reveal", {
        start: "top 88%",
        once: true,
        onEnter: (els) => gsap.fromTo(els, { y: 40, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.4)", stagger: 0.09, overwrite: true }),
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return ref;
}

/** Spotlight follows the cursor over .glass cards. */
export function spotlight(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/** Buttons that lean toward the cursor. */
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, [strength]);
  return <span ref={ref} className="inline-block">{children}</span>;
}

/** Counts up when scrolled into view. */
export function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) { el.textContent = `${prefix}${to}${suffix}`; return; }
    const o = { v: 0 };
    const t = gsap.to(o, { v: to, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: () => { el.textContent = `${prefix}${Math.round(o.v)}${suffix}`; } });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, [to, suffix, prefix]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/** Pixel-square confetti burst at a point. */
export function burst(x: number, y: number, n = 36) {
  if (reduced()) return;
  const colors = ["#ffec27", "#ff77a8", "#29adff", "#00e436", "#ffa300"];
  for (let i = 0; i < n; i++) {
    const d = document.createElement("i");
    Object.assign(d.style, { position: "fixed", left: `${x}px`, top: `${y}px`, width: "8px", height: "8px", background: colors[i % colors.length], zIndex: "70", pointerEvents: "none", border: "2px solid #241a2e" });
    document.body.appendChild(d);
    gsap.to(d, { x: gsap.utils.random(-220, 220), y: gsap.utils.random(-260, 120), rotation: gsap.utils.random(-360, 360), opacity: 0, duration: gsap.utils.random(0.9, 1.6), ease: "power2.out", onComplete: () => d.remove() });
  }
}

/** Custom pixel cursor + scroll progress bar. */
export function PageChrome() {
  const dot = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const d = dot.current;
    const ctx = gsap.context(() => {
      if (bar.current) gsap.to(bar.current, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });
    });
    if (!d || reduced()) return () => ctx.revert();
    const xTo = gsap.quickTo(d, "x", { duration: 0.18, ease: "power3.out" });
    const yTo = gsap.quickTo(d, "y", { duration: 0.18, ease: "power3.out" });
    const mv = (e: MouseEvent) => { xTo(e.clientX); yTo(e.clientY); };
    const over = (e: MouseEvent) => {
      const hot = (e.target as HTMLElement).closest("a,button,summary,input,label");
      gsap.to(d, { scale: hot ? 1.8 : 1, rotation: hot ? 45 : 0, duration: 0.2 });
    };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseover", over); ctx.revert(); };
  }, []);
  return (
    <>
      <div ref={bar} className="fixed left-0 top-0 z-[60] h-1.5 w-full origin-left scale-x-0 bg-gradient-to-r from-yellow via-pink to-blue" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
