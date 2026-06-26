import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { useReducedMotion } from './useReducedMotion.js';

// Exponential ease-out — calm, no bounce (matches the motion guidance in DESIGN.md).
const EASE_OUT_EXPO = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const LENIS_OPTIONS = {
  duration: 1.1,
  easing: EASE_OUT_EXPO,
  smoothWheel: true,
};

/**
 * Wraps the app in Lenis smooth / inertia scrolling.
 *
 * Under reduced motion, Lenis is skipped entirely and native scrolling is used —
 * both the accessibility path and the deliberate "fast mode". Children can read
 * the active instance via `useLenis` from `lenis/react`; it returns undefined when
 * Lenis is absent (reduced motion), so consumers must fall back to native scroll.
 *
 * Note: until the app shell becomes a scrolling document (Phase 2), the page does
 * not scroll, so Lenis is wired but dormant — harmless, and ready for the spine.
 */
export default function LenisProvider({ children }) {
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <ReactLenis root options={LENIS_OPTIONS}>
      {children}
    </ReactLenis>
  );
}
