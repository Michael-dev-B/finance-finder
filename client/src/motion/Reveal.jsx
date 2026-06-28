import { useRef, useLayoutEffect } from 'react';
import { useReducedMotion } from './useReducedMotion.js';
import { revealOnEnter, revealStagger } from './scrollReveal.js';

/**
 * Reveals its content with a single fade/rise as it enters the viewport.
 * Under reduced motion it renders statically (the deliberate fast path).
 *
 * useLayoutEffect applies the hidden "from" state before paint, so there is no
 * flash; if effects never run the content stays visible (see scrollReveal.js).
 */
export function Reveal({ y, delay, className, children, ...rest }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced) return;
    return revealOnEnter(ref.current, { y, delay });
  }, [reduced, y, delay]);

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}

/**
 * Staggers its direct children into view. Used in App keyed by activeView so the
 * entrance replays each time the workspace switches views.
 */
export function RevealView({ className, children, ...rest }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced) return;
    return revealStagger(ref.current);
  }, [reduced]);

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
