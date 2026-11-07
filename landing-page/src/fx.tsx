import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Children marked .reveal pop in (stepped, like the app's sprites) as they scroll into view. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.batch(".reveal", {
        start: "top 90%",
        once: true,
        onEnter: (els) => gsap.fromTo(els, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "steps(6)", stagger: 0.08, overwrite: true }),
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return ref;
}
