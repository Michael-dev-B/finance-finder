import { useState, useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion.js';

/**
 * Scroll progress across the hero: 0 at the top, 1 once the next viewport (the docked
 * workspace) is reached. Reads the real scroll position, so it works whether Lenis
 * (which drives native scroll) or the browser itself is scrolling.
 *
 * Returns 0 under reduced motion — the hero stays static, fully visible (fast mode).
 * rAF-throttled, so subscribers re-render at most once per frame.
 */
export function useScrollProgress() {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) {
      setProgress(0);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = window.innerHeight || 1;
      setProgress(Math.min(1, Math.max(0, window.scrollY / h)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return progress;
}

/**
 * How centered a given full-viewport section is: 1 when section `index` fills the
 * viewport, fading to 0 a viewport away in either direction. Drives the journey
 * overlays' fade-in/out as the viewer scrolls between scenes.
 *
 * Under reduced motion this is a constant 1 — each opaque section's overlay is simply
 * visible when reached (no scroll-driven fade).
 */
export function useSectionFocus(index) {
  const reduced = useReducedMotion();
  const [focus, setFocus] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      setFocus(1);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = window.innerHeight || 1;
      setFocus(Math.max(0, 1 - Math.abs(window.scrollY / h - index)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, index]);

  return focus;
}
