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
