import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Reactively tracks the user's reduced-motion preference.
 *
 * Returns `true` when the OS/browser requests reduced motion. The immersive layer
 * uses this to disable inertia scrolling and scroll-jacking, collapse cinematic
 * transitions to instant ones, and swap the WebGL hero for a static poster.
 * It doubles as the app's deliberate "fast mode".
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
