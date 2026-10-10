// One shared set of easings and durations so all motion feels related.
export const ease = { in: "power3.out", move: "power2.inOut", reveal: "expo.out" } as const;
export const dur = { ui: 0.4, fast: 0.3, hero: 0.9 } as const;
export const stagger = 0.06;

/** True when the OS asks for reduced motion OR the user switched it on in the header. */
export function reducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  return document.documentElement.dataset.reduceMotion === "true";
}
