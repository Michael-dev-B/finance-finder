import { useRef, useState, useEffect } from 'react';

/**
 * A full-viewport scroll section whose (heavy) children mount only once it first comes
 * within ±1 viewport — so the nine dashboards aren't all live at app start. It latches:
 * once mounted it stays mounted, which keeps scroll height stable (no collapse-jump) and
 * preserves any in-view form state. Reserves min-h-[100svh] before mount. Visible-by-
 * default where IntersectionObserver is unavailable (headless/SSR).
 */
export default function LazySection({ id, className = '', children }) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setMounted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: '100% 0px 100% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`relative flex min-h-[100svh] items-center ${className}`}
    >
      {mounted ? children : null}
    </section>
  );
}
