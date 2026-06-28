import { gsap } from 'gsap';

// Calm exponential ease-out (no bounce) — matches the motion guidance in DESIGN.md
// and the LenisProvider easing.
const DEFAULTS = { y: 16, duration: 0.5, ease: 'expo.out' };

// Fire slightly before the element is fully on screen so the reveal feels anticipatory.
const IO_OPTIONS = { threshold: 0.15, rootMargin: '0px 0px -10% 0px' };

const supportsIO = typeof IntersectionObserver !== 'undefined';

/**
 * Animate an element into view the first time it enters the viewport.
 *
 * The hidden state is applied AND cleared by this function, so if it never runs
 * (headless render, JS disabled) the element simply stays visible — reveals enhance
 * an already-visible default rather than gating visibility on a class transition.
 *
 * The IntersectionObserver uses the default (viewport) root, which works whether the
 * scroll container is today's <main> or (Phase 2) the window.
 *
 * @returns {() => void} cleanup
 */
export function revealOnEnter(el, opts = {}) {
  if (!el) return () => {};
  const { y, duration, ease, delay = 0 } = { ...DEFAULTS, ...opts };

  gsap.set(el, { opacity: 0, y });
  const animate = () => gsap.to(el, { opacity: 1, y: 0, duration, ease, delay });
  const cleanup = () => {
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: 'opacity,transform' });
  };

  if (!supportsIO) {
    animate();
    return cleanup;
  }

  const io = new IntersectionObserver((entries, observer) => {
    if (entries.some((e) => e.isIntersecting)) {
      animate();
      observer.disconnect();
    }
  }, IO_OPTIONS);
  io.observe(el);

  return () => {
    io.disconnect();
    cleanup();
  };
}

/**
 * Stagger the direct children of a container into view together once the container
 * enters the viewport. Same visible-by-default contract as revealOnEnter.
 *
 * @returns {() => void} cleanup
 */
export function revealStagger(container, opts = {}) {
  if (!container) return () => {};
  const {
    selector = ':scope > *',
    y, duration, ease,
    stagger = 0.06,
  } = { ...DEFAULTS, ...opts };

  const items = Array.from(container.querySelectorAll(selector));
  if (items.length === 0) return () => {};

  gsap.set(items, { opacity: 0, y });
  const animate = () => gsap.to(items, { opacity: 1, y: 0, duration, ease, stagger });
  const cleanup = () => {
    gsap.killTweensOf(items);
    gsap.set(items, { clearProps: 'opacity,transform' });
  };

  if (!supportsIO) {
    animate();
    return cleanup;
  }

  const io = new IntersectionObserver((entries, observer) => {
    if (entries.some((e) => e.isIntersecting)) {
      animate();
      observer.disconnect();
    }
  }, IO_OPTIONS);
  io.observe(container);

  return () => {
    io.disconnect();
    cleanup();
  };
}
