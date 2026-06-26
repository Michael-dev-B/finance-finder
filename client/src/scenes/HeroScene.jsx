import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * The hero centerpiece: a stack of wireframe "signal" lines whose vertices ride layered
 * sine waves — a cashflow oscilloscope. Thin additive lines + the canvas's Bloom give the
 * bold brand glow. Scroll drives the whole stack back and fades it out, so the WebGL
 * recedes as the viewer descends into the docked workspace.
 *
 * Cinematic (brand) register only — this is the documented exception to the Command Room's
 * Semantic-Lock / Flat rules (see DESIGN.md §7). Nothing below the hero uses it.
 */

const LINE_COUNT = 9;
const POINTS = 140;
const WIDTH = 18; // world units; wider than the frustum so lines run off both edges
const SPACING = 0.5;

// sRGB approximations of the DESIGN.md OKLCH tokens (three's Color can't parse oklch()):
const BRIGHT = '#2ba8e6'; // ≈ Console Blue  oklch(74% 0.18 225)
const DEEP = '#2e54d4'; //   ≈ Console Deep  oklch(50% 0.17 250)

// Layered sine components: [amplitude, spatialFreq, timeSpeed, phasePerLine].
const WAVES = [
  [0.22, 0.45, 0.6, 0.5],
  [0.12, 0.9, -0.9, 1.1],
  [0.06, 1.7, 1.3, 0.3],
];

function waveY(x, t, line) {
  let y = 0;
  for (let w = 0; w < WAVES.length; w++) {
    const [amp, sf, sp, pp] = WAVES[w];
    y += amp * Math.sin(x * sf + t * sp + line * pp);
  }
  return y;
}

function scrollProgress() {
  if (typeof window === 'undefined') return 0;
  const h = window.innerHeight || 1;
  return Math.min(1, Math.max(0, window.scrollY / h));
}

export default function HeroScene() {
  const groupRef = useRef(null);

  const lines = useMemo(() => {
    const bright = new THREE.Color(BRIGHT);
    const deep = new THREE.Color(DEEP);
    const arr = [];
    for (let i = 0; i < LINE_COUNT; i++) {
      const positions = new Float32Array(POINTS * 3);
      for (let p = 0; p < POINTS; p++) {
        positions[p * 3] = -WIDTH / 2 + (WIDTH * p) / (POINTS - 1);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const t = LINE_COUNT === 1 ? 1 : i / (LINE_COUNT - 1);
      const material = new THREE.LineBasicMaterial({
        color: deep.clone().lerp(bright, t),
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const baseY = (i - (LINE_COUNT - 1) / 2) * SPACING;
      arr.push({ object: new THREE.Line(geometry, material), positions, baseY });
    }
    return arr;
  }, []);

  useEffect(
    () => () => {
      for (const l of lines) {
        l.object.geometry.dispose();
        l.object.material.dispose();
      }
    },
    [lines],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const sp = scrollProgress();
    for (let i = 0; i < lines.length; i++) {
      const { object, positions, baseY } = lines[i];
      for (let p = 0; p < POINTS; p++) {
        positions[p * 3 + 1] = baseY + waveY(positions[p * 3], t, i);
      }
      object.geometry.attributes.position.needsUpdate = true;
      object.material.opacity = 0.9 * (1 - sp);
    }
    if (groupRef.current) {
      groupRef.current.position.y = sp * 1.5;
      groupRef.current.position.z = -sp * 3;
    }
  });

  return (
    <group ref={groupRef}>
      {lines.map((l, i) => (
        <primitive key={i} object={l.object} />
      ))}
    </group>
  );
}
