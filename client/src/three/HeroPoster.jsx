// Static, no-WebGL stand-in for the hero. Used as the Suspense fallback while the lazy
// 3D chunk loads, and as the hero itself under reduced motion. Fixed behind all content,
// purely decorative (aria-hidden) — it echoes the live signal-wave scene so Act I always
// reads as intentional even with zero WebGL.

const W = 1200;
const H = 800;

function wavePath(baseY, amp, freq, phase) {
  const N = 64;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = (W * i) / N;
    const y = baseY + amp * Math.sin((i / N) * Math.PI * 2 * freq + phase);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join(' L')}`;
}

// Stacked signal lines, brighter (Console Blue) toward the middle, deeper at the edges.
const LINES = Array.from({ length: 9 }, (_, i) => ({
  d: wavePath(280 + i * 28, 24 + (i % 3) * 9, 2 + (i % 4) * 0.4, i * 0.7),
  bright: i >= 3 && i <= 6,
  opacity: 0.16 + (1 - Math.abs(i - 4) / 4) * 0.5,
}));

export default function HeroPoster() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-bg">
      <div
        className="absolute left-1/2 top-1/2 h-[55vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--color-accent), transparent)' }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {LINES.map((l, i) => (
          <path
            key={i}
            d={l.d}
            stroke={l.bright ? 'var(--color-primary)' : 'var(--color-accent)'}
            strokeWidth="2"
            strokeOpacity={l.opacity}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
}
