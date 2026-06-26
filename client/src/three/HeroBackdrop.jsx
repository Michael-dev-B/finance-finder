import { Suspense, lazy, memo } from 'react';
import { useReducedMotion } from '../motion/useReducedMotion.js';
import HeroPoster from './HeroPoster.jsx';

// The heavy 3D stack (three + R3F + postprocessing) lives in its own chunk, imported
// only when the WebGL scenes are actually shown — daily load isn't taxed by it.
const PersistentCanvas = lazy(() => import('./PersistentCanvas.jsx'));

/**
 * Picks the hero/journey backdrop. Under reduced motion we never touch WebGL — the static
 * poster IS the backdrop (the 3D chunk is never fetched; the DOM overlays carry the data).
 * Otherwise the poster is the Suspense fallback while the lazy canvas loads.
 *
 * `data` (from useJourneyData) is passed through as props — React context does not cross
 * the R3F <Canvas> boundary. Memoized so unrelated App re-renders don't reconcile the
 * canvas subtree (the data object is itself memoized).
 */
function HeroBackdrop({ data }) {
  const reduced = useReducedMotion();

  if (reduced) return <HeroPoster />;

  return (
    <Suspense fallback={<HeroPoster />}>
      <PersistentCanvas data={data} />
    </Suspense>
  );
}

export default memo(HeroBackdrop);
