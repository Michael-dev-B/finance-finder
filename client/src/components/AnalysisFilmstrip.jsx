import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap, ScrollTrigger } from '../motion/scrollTrigger.js';
import { useReducedMotion } from '../motion/useReducedMotion.js';
import LazySection from './LazySection.jsx';
import { IncomeView, TrendsView, AnalyticsView } from './WorkspaceViews.jsx';

// The chart cluster — the one horizontal beat. Scrolling down pins the section and pans
// sideways across the three panels, then vertical resumes. Under reduced motion it degrades
// to three plain vertical sections (no pin). Order is shared with App for scroll-to.
export const FILMSTRIP_VIEWS = ['income', 'trends', 'analytics'];

const PANELS = [
  { id: 'income', Comp: IncomeView },
  { id: 'trends', Comp: TrendsView },
  { id: 'analytics', Comp: AnalyticsView },
];

export default function AnalysisFilmstrip({ onActivePanel }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <>
        {PANELS.map((panel) => (
          <LazySection key={panel.id} id={`view-${panel.id}`} className="pl-14">
            <panel.Comp />
          </LazySection>
        ))}
      </>
    );
  }

  return <Pinned onActivePanel={onActivePanel} />;
}

function Pinned({ onActivePanel }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [near, setNear] = useState(false);

  // Lazy-mount the (heavy) chart panels once the cluster is near.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '100% 0px 100% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          id: 'analysis',
          trigger: section,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!onActivePanel) return;
            const i = Math.round(self.progress * (PANELS.length - 1));
            onActivePanel(PANELS[i].id);
          },
        },
      });
    }, section);
    return () => ctx.revert();
  }, [onActivePanel]);

  return (
    <section id="analysis" ref={sectionRef} className="relative h-[100svh] overflow-hidden">
      <div ref={trackRef} className="flex h-full flex-nowrap will-change-transform">
        {PANELS.map((panel) => (
          <div
            key={panel.id}
            className="flex h-full w-screen shrink-0 items-center overflow-hidden pl-14"
          >
            {near ? <panel.Comp /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
