// Optional CRT effect: drifting scanlines, a slow refresh sweep, and a vignette.
// Animations live in index.css (.nc-crt-lines / .nc-crt-sweep).
const sweep = {
  top: '-40vh',
  height: '40vh',
  background:
    'linear-gradient(to bottom, transparent, rgba(150,210,255,0.06) 45%, rgba(150,210,255,0.06) 55%, transparent)',
};
const vignette = { background: 'radial-gradient(ellipse at center, transparent 62%, rgba(0,0,0,0.4) 100%)' };

export default function CrtOverlay({ crt, scanBg }) {
  if (!crt) return null;
  return (
    <>
      <div
        className="nc-crt-lines fixed inset-0 z-[9990] pointer-events-none mix-blend-multiply"
        style={{ background: scanBg }}
      />
      <div className="nc-crt-sweep fixed left-0 right-0 z-[9991] pointer-events-none mix-blend-screen" style={sweep} />
      <div className="fixed inset-0 z-[9990] pointer-events-none" style={vignette} />
    </>
  );
}
