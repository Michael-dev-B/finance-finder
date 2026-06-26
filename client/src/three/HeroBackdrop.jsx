import { Suspense, lazy } from 'react';
import { useReducedMotion } from '../motion/useReducedMotion.js';
import HeroPoster from './HeroPoster.jsx';

// The heavy 3D stack (three + R3F + postprocessing) lives in its own chunk, imported
// only when the WebGL hero is actually shown — daily load isn't taxed by it.
const PersistentCanvas = lazy(() => import('./PersistentCanvas.jsx'));

/**
 * Picks the hero backdrop. Under reduced motion we never touch WebGL — the static poster
 * IS the hero (the 3D chunk is never fetched). Otherwise the poster is the Suspense
 * fallback shown while the lazy canvas loads, so the hero never flashes blank.
 *
 * This is the single element main.jsx mounts behind the app.
 */
export default function HeroBackdrop() {
  const reduced = useReducedMotion();

  if (reduced) return <HeroPoster />;

  return (
    <Suspense fallback={<HeroPoster />}>
      <PersistentCanvas />
    </Suspense>
  );
}
