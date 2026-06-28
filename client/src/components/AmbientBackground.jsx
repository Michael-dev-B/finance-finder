// The unified, site-wide backdrop every page shares — a calm "command-room atmosphere" so the
// cinematic hero and the working dashboards read as one continuous space. Aurora drift: a few
// large, soft Console-Blue / Console-Deep glows breathing slowly on Command Black, plus an edge
// vignette to keep foreground content centered and readable.
//
// Fixed and behind everything (z-index -20, under the WebGL canvas at -10), aria-hidden and
// non-interactive. Motion is pure CSS (.aurora-* in global.css), so the global
// prefers-reduced-motion rule freezes it to a static wash with no JS branch here. Kept faint by
// construction — workspace cards/tables sit on opaque surfaces, so only the gutters reveal it.
export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -20 }}
    >
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      <div className="ambient-vignette" />
    </div>
  );
}
