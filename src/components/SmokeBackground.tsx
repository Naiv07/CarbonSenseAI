/**
 * SmokeBackground — full-viewport SVG smoke with static feTurbulence +
 * feDisplacementMap for organic wispy shapes, and CSS drift animations
 * for all per-frame movement (GPU-composited, zero CPU per-frame cost).
 *
 * The turbulence texture is computed once on mount and cached by the
 * browser — only the CSS transforms run each frame. Respects
 * prefers-reduced-motion.
 */
export default function SmokeBackground() {
  return (
    <svg
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      style={{ mixBlendMode: "screen" }}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Color gradients */}
        <radialGradient id="sm-indigo" cx="40%" cy="50%" r="60%">
          <stop offset="0%"  stopColor="#5e6bff" stopOpacity="0.28" />
          <stop offset="45%" stopColor="#5e6bff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#5e6bff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sm-lavender" cx="60%" cy="50%" r="60%">
          <stop offset="0%"  stopColor="#bec2ff" stopOpacity="0.24" />
          <stop offset="50%" stopColor="#bec2ff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#bec2ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sm-green" cx="50%" cy="50%" r="55%">
          <stop offset="0%"  stopColor="#22c55e" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sm-wash" cx="50%" cy="45%" r="75%">
          <stop offset="0%"  stopColor="#5e6bff" stopOpacity="0.07" />
          <stop offset="60%" stopColor="#bec2ff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#5e6bff" stopOpacity="0.015" />
        </radialGradient>

        {/* Deep layer: heavy blur only */}
        <filter id="sm-deep" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="55" />
        </filter>

        {/* Mid layer: static turbulence warp — computed once, cached */}
        <filter id="sm-smoke-a" x="-60%" y="-60%" width="220%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.005 0.01" numOctaves={2} seed={7} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={120} xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="18" />
        </filter>

        <filter id="sm-smoke-b" x="-60%" y="-60%" width="220%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.005 0.009" numOctaves={2} seed={23} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={150} xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="14" />
        </filter>

        {/* Foreground: tighter turbulence, sharper wisps */}
        <filter id="sm-smoke-c" x="-80%" y="-80%" width="260%" height="260%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.022" numOctaves={3} seed={41} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={90} xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="8" />
        </filter>

        <style>{`
          .sm-drift  { animation: sm-d1 38s ease-in-out infinite alternate; transform-origin: center; }
          .sm-drift2 { animation: sm-d2 30s ease-in-out infinite alternate; transform-origin: center; }
          .sm-drift3 { animation: sm-d3 24s ease-in-out infinite alternate; transform-origin: center; }
          .sm-drift4 { animation: sm-d4 18s ease-in-out infinite alternate; transform-origin: center; }
          .sm-rise1  { animation: sm-r1 34s ease-in-out infinite; transform-origin: center; }
          .sm-rise2  { animation: sm-r2 42s ease-in-out infinite; animation-delay: -18s; transform-origin: center; }
          .sm-rise3  { animation: sm-r3 38s ease-in-out infinite; animation-delay: -9s; transform-origin: center; }

          @keyframes sm-d1 {
            0%   { transform: translate(0,0) rotate(0deg) scale(1); }
            50%  { transform: translate(50px,20px) rotate(2deg) scale(1.06); }
            100% { transform: translate(90px,-15px) rotate(-2deg) scale(1.02); }
          }
          @keyframes sm-d2 {
            0%   { transform: translate(0,0) rotate(0deg) scale(1); }
            50%  { transform: translate(-45px,-25px) rotate(-3deg) scale(1.08); }
            100% { transform: translate(-80px,20px) rotate(2deg) scale(0.98); }
          }
          @keyframes sm-d3 {
            0%   { transform: translate(0,0) rotate(0deg) scaleX(1); }
            50%  { transform: translate(40px,-20px) rotate(4deg) scaleX(1.12); }
            100% { transform: translate(-25px,15px) rotate(-3deg) scaleX(0.92); }
          }
          @keyframes sm-d4 {
            0%   { transform: translate(0,0) rotate(0deg); opacity:.65; }
            50%  { transform: translate(-30px,18px) rotate(-5deg); opacity:1; }
            100% { transform: translate(55px,-12px) rotate(6deg); opacity:.75; }
          }
          @keyframes sm-r1 {
            0%   { transform: translate(0,0); opacity:0; }
            20%  { opacity:1; }
            70%  { opacity:.6; }
            100% { transform: translate(30px,-780px); opacity:0; }
          }
          @keyframes sm-r2 {
            0%   { transform: translate(0,0); opacity:0; }
            20%  { opacity:.95; }
            70%  { opacity:.55; }
            100% { transform: translate(-25px,-880px); opacity:0; }
          }
          @keyframes sm-r3 {
            0%   { transform: translate(0,0); opacity:0; }
            20%  { opacity:.8; }
            70%  { opacity:.45; }
            100% { transform: translate(20px,-840px); opacity:0; }
          }

          @media (prefers-reduced-motion: reduce) {
            .sm-drift, .sm-drift2, .sm-drift3, .sm-drift4,
            .sm-rise1, .sm-rise2, .sm-rise3 { animation: none; }
          }
        `}</style>
      </defs>

      {/* Base wash */}
      <rect x="0" y="0" width="1440" height="900" fill="url(#sm-wash)" />

      {/* Deep background haze */}
      <g className="sm-drift" filter="url(#sm-deep)">
        <ellipse cx="280" cy="140" rx="620" ry="320" fill="url(#sm-indigo)" />
        <ellipse cx="1300" cy="120" rx="500" ry="280" fill="url(#sm-lavender)" opacity=".8" />
      </g>
      <g className="sm-drift2" filter="url(#sm-deep)">
        <ellipse cx="1220" cy="780" rx="580" ry="340" fill="url(#sm-lavender)" />
        <ellipse cx="180" cy="820" rx="520" ry="300" fill="url(#sm-indigo)" opacity=".85" />
        <ellipse cx="720" cy="460" rx="480" ry="260" fill="url(#sm-green)" opacity=".8" />
      </g>

      {/* Mid tendrils */}
      <g className="sm-drift" filter="url(#sm-smoke-a)">
        <ellipse cx="380" cy="230" rx="400" ry="95" fill="url(#sm-indigo)" />
        <ellipse cx="640" cy="640" rx="380" ry="90" fill="url(#sm-lavender)" opacity=".9" />
        <ellipse cx="160" cy="500" rx="300" ry="80" fill="url(#sm-lavender)" opacity=".8" />
      </g>
      <g className="sm-drift2" filter="url(#sm-smoke-b)">
        <ellipse cx="1120" cy="560" rx="400" ry="92" fill="url(#sm-lavender)" />
        <ellipse cx="880" cy="320" rx="340" ry="80" fill="url(#sm-indigo)" opacity=".9" />
        <ellipse cx="1240" cy="200" rx="300" ry="75" fill="url(#sm-green)" opacity=".75" />
        <ellipse cx="1340" cy="840" rx="320" ry="85" fill="url(#sm-indigo)" opacity=".8" />
        <ellipse cx="420" cy="860" rx="340" ry="80" fill="url(#sm-lavender)" opacity=".75" />
      </g>

      {/* Rising plumes — CSS-driven translation + opacity */}
      <g filter="url(#sm-smoke-b)" opacity=".95">
        <ellipse className="sm-rise1" cx="500" cy="900" rx="220" ry="150" fill="url(#sm-indigo)" />
        <ellipse className="sm-rise2" cx="1000" cy="950" rx="200" ry="140" fill="url(#sm-lavender)" />
        <ellipse className="sm-rise3" cx="180" cy="930" rx="180" ry="130" fill="url(#sm-green)" />
      </g>

      {/* Foreground wisps */}
      <g className="sm-drift3" filter="url(#sm-smoke-c)">
        <ellipse cx="300" cy="320" rx="200" ry="48" fill="url(#sm-indigo)" />
        <ellipse cx="1080" cy="480" rx="180" ry="44" fill="url(#sm-lavender)" />
        <ellipse cx="1300" cy="680" rx="160" ry="40" fill="url(#sm-indigo)" opacity=".85" />
      </g>
      <g className="sm-drift4" filter="url(#sm-smoke-c)">
        <ellipse cx="760" cy="650" rx="220" ry="52" fill="url(#sm-green)" opacity=".85" />
        <ellipse cx="560" cy="150" rx="180" ry="44" fill="url(#sm-lavender)" opacity=".9" />
      </g>
    </svg>
  );
}
